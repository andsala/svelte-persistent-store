import {generator} from './generator';

const g = generator(window.localStorage);

export const readable = g.readable;
export const writable = g.writable;
export const derived = g.derived;
export const get = g.get;
