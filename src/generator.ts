import {writable as ogWritable, get as ogGet, Readable, Writable} from 'svelte/store';
import {run_all, noop, is_function} from 'svelte/internal';

/** Callback to inform of a value updates. */
type Subscriber<T> = (value: T) => void;

/** Unsubscribes from value updates. */
type Unsubscriber = () => void;

/** Callback to update a value. */
type Updater<T> = (value: T) => T;

/** Cleanup logic callback. */
type Invalidator<T> = (value?: T) => void;

/** Start and stop notification callbacks. */
type StartStopNotifier<T> = (set: Subscriber<T>) => Unsubscriber | void;

/** One or more `Readable`s. */
type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>];

/** One or more values from `Readable` stores. */
type StoresValues<T> = T extends Readable<infer U> ? U :
    { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

export type StoreModule = {
    readable: (key: string, value: string, start: StartStopNotifier<string>) => Readable<string>;
    writable: (key: string, value: string, start: StartStopNotifier<string>) => Writable<string>;
    derived: <S extends Stores>(key: string, stores: S, fn: (values: StoresValues<S>, set?: Subscriber<string>) => string | Unsubscriber | void, initial_value?: string) => Readable<string>;
    get: (store: any) => any;
}

export function generator(storage: Storage): StoreModule {

    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param key storage key
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(key: string, value: string, start: StartStopNotifier<string>): Readable<string> {
        return {
            subscribe: writable(key, value, start).subscribe
        }
    }

    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param key storage key
     * @param {*=}value default value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(key: string, value: string, start: StartStopNotifier<string> = noop): Writable<string> {
        function wrap_start(ogSet: Subscriber<string>) {
            return start(function wrap_set(new_value: string) {
                if (storage) {
                    storage.setItem(key, new_value);
                }
                return ogSet(new_value)
            });
        }

        if (storage) {
            if (storage.getItem(key)) {
                value = storage.getItem(key);
            }
            storage.setItem(key, value);
        }

        const ogStore = ogWritable(value, start ? wrap_start : undefined);

        function set(new_value: string): void {
            if (storage) {
                storage.setItem(key, new_value);
            }
            ogStore.set(new_value);
        }

        function update(fn: Updater<string>): void {
            set(fn(ogGet(ogStore)));
        }

        function subscribe(run: Subscriber<string>, invalidate: Invalidator<string> = noop): Unsubscriber {
            return ogStore.subscribe(run, invalidate);
        }

        return {set, update, subscribe};
    }


    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param key storage key
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived<S extends Stores>(
        key: string,
        stores: S,
        fn: (values: StoresValues<S>, set?: Subscriber<string>) => string | Unsubscriber | void,
        initial_value?: string,
    ): Readable<string> {
        const single = !Array.isArray(stores);
        const stores_array: Array<Readable<any>> = single
            ? [stores as Readable<any>]
            : stores as Array<Readable<any>>;

        const auto = fn.length < 2;

        if (storage && storage.getItem(key)) {
            initial_value = storage.getItem(key);
        }

        return readable(key, initial_value, (set) => {
            let inited = false;
            const values: StoresValues<S> = [] as StoresValues<S>;

            let pending = 0;
            let cleanup = noop;

            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result as string);
                } else {
                    cleanup = is_function(result) ? result as Unsubscriber : noop;
                }
            };

            const unsubscribers = stores_array.map((store, i) => store.subscribe(
                (value) => {
                    values[i] = value;
                    pending &= ~(1 << i);
                    if (inited) {
                        sync();
                    }
                },
                () => {
                    pending |= (1 << i);
                }),
            );

            inited = true;
            sync();

            return function stop() {
                run_all(unsubscribers);
                cleanup();
            }
        });
    }

    return {
        readable,
        writable,
        derived,
        get: ogGet
    }
}
