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

type SimpleDeriver<T,U> = (values: StoresValues<T>) => U
type AdvancedDeriver<T,U> = (values: StoresValues<T>, set: Subscriber<U>) => Unsubscriber | void
type Deriver<T,U> = SimpleDeriver<T, U> | AdvancedDeriver<T, U>

function isSimpleDeriver<T,U>(deriver: Deriver<T,U>): deriver is SimpleDeriver<T,U> {
    return deriver.length < 2;
}

export type StoreModule = {
    readable: <T>(key: string, value: T, start: StartStopNotifier<T>) => Readable<T>;
    writable: <T>(key: string, value: T, start?: StartStopNotifier<T>) => Writable<T>;
    derived: <S extends Stores, U>(key: string, stores: S, fn: Deriver<S,U>, initial_value?: U) => Readable<U>;
    get: typeof ogGet;
}

export function generator(storage: Storage): StoreModule {

    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param key storage key
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable<T>(key: string, value: T, start: StartStopNotifier<T>): Readable<T> {
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
    function writable<T>(key: string, value: T, start: StartStopNotifier<T> = noop): Writable<T> {
        function wrap_start(ogSet: Subscriber<T>) {
            return start(function wrap_set(new_value: T) {
                if (storage) {
                    storage.setItem(key, JSON.stringify(new_value));
                }
                return ogSet(new_value)
            });
        }

        if (storage) {
            if (storage.getItem(key)) {
                value = JSON.parse(storage.getItem(key));
            }
            storage.setItem(key, JSON.stringify(value));
        }

        const ogStore = ogWritable(value, start ? wrap_start : undefined);

        function set(new_value: T): void {
            if (storage) {
                storage.setItem(key, JSON.stringify(new_value));
            }
            ogStore.set(new_value);
        }

        function update(fn: Updater<T>): void {
            set(fn(ogGet(ogStore)));
        }

        function subscribe(run: Subscriber<T>, invalidate: Invalidator<T> = noop): Unsubscriber {
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
    function derived<S extends Stores, U>(
        key: string,
        stores: S,
        fn: Deriver<S,U>,
        initial_value?: U,
    ): Readable<U> {
        const single = !Array.isArray(stores);
        const stores_array: Array<Readable<any>> = single
            ? [stores as Readable<any>]
            : stores as Array<Readable<any>>;

        if (storage && storage.getItem(key)) {
            initial_value = JSON.parse(storage.getItem(key));
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
                const input: StoresValues<S> = single ? values[0] : values;
                if (isSimpleDeriver(fn)) {
                    set(fn(input));
                } else {
                    const result = fn(input, set);
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
