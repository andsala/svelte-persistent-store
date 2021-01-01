# svelte-persistent-store

[![npm version](https://badge.fury.io/js/svelte-persistent-store.svg)](https://badge.fury.io/js/svelte-persistent-store)
[![Build Status](https://travis-ci.org/andsala/svelte-persistent-store.svg?branch=master)](https://travis-ci.org/andsala/svelte-persistent-store)

Persist your [svelte store](https://svelte.dev/docs#svelte_store) in `localStorage` or `sessionStorage`.

## Install

```sh
npm install --save svelte-persistent-store
```

## Usage

Persist to `localStorage`

```javascript
import { writable, readable, derived } from 'svelte-persistent-store/dist/local';
// or
import { local } from 'svelte-persistent-store';
const { writable, readable, derived } = local;

const count = writable('count', 0);

count.set(1);
```

Persist to `sessionStorage`

```javascript
import { writable, readable, derived } from 'svelte-persistent-store/dist/session';
// or
import { session } from 'svelte-persistent-store';
const { writable, readable, derived } = session;

const count = writable('count', 0);

count.set(1);
```

## API

`key` parameter is used by `localStorage` and `sessionStorage` to store and retrieve the value.

The [Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage) interface specification only allows string
values, therefore this library serializes stored values as JSON.

```typescript
// writable store of `T` values
store = writable(key: string, value: T, (set: (value: T) => void) => () => void)
// readable store of `T` values
store = readable(key: string, value: T, (set: (value: T) => void) => () => void)
// store of `U` values derived from store `a` of `T` values
store = derived(key: string, a, callback: (a: T, set: (value: U) => void) => void | () => void, initial_value: U)
// store of `U` values derived from stores `[a, ...b]` of `[T1, T2, ...]` values
store = derived(key: string, [a, ...b], callback: ([a: T1, ...b], set: (value: U) => void) => void | () => void, initial_value: U)
// get value from a store (re-export from 'svelte/store')
value: any = get(store)
```
