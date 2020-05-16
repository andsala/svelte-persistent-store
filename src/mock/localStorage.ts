
(<any> window) = {
  localStorage: {
    length: 0,
    store: {},
    key(_: number): string | null {
      return undefined;
    },
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = `${value}`;
    },
    removeItem(key: string) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    }
  }
};

