import {generator} from './generator';

const storage: Storage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const {
    readable,
    writable,
    derived,
    get
} = generator(storage);
