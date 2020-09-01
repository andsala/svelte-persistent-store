import {generator} from './generator';

const storage: Storage = typeof window !== 'undefined' ? window.localStorage : undefined;

const g = generator(storage);

export const readable = g.readable;
export const writable = g.writable;
export const derived = g.derived;
export const get = g.get;
