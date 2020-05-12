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
import { writable, readable, derived } from 'svelte-persistent-store/local';

const count = writable('count', 0);

count.set(1);
```

Persist to `sessionStorage`

```javascript
import { writable, readable, derived } from 'svelte-persistent-store/session';

const count = writable('count', 0);

count.set(1);
```

## API

`key` parameter is used by `localStorage` and `sessionStorage` to store and retrieve the value.

Only strings can be stored due to the [Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage) interface
specification.

```typescript
store = writable(key: string, value: string, (set: (value: string) => void) => () => void)
store = readable(key: string, value: string, (set: (value: string) => void) => () => void)
store = derived(key: string, a, callback: (a: any, set: (value: string) => void) => void | () => void, initial_value: string)
store = derived(key: string, [a, ...b], callback: ([a: string, ...b: string[]], set: (value: string) => void) => void | () => void, initial_value: string)
value: any = get(store)
```
