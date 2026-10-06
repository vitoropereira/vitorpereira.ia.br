// Mocks de teste: jsdom não implementa IntersectionObserver nem matchMedia.
type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

export function mockIntersectionObserver() {
  const original = globalThis.IntersectionObserver;
  const instances: {
    cb: Callback;
    disconnected: boolean;
    options?: IntersectionObserverInit;
  }[] = [];
  class FakeIO {
    private self: (typeof instances)[number];
    constructor(cb: Callback, options?: IntersectionObserverInit) {
      this.self = { cb, disconnected: false, options };
      instances.push(this.self);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.self.disconnected = true;
    }
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    FakeIO as unknown as typeof IntersectionObserver;
  return {
    trigger(isIntersecting = true) {
      for (const i of instances)
        if (!i.disconnected) i.cb([{ isIntersecting }]);
    },
    instances,
    restore() {
      globalThis.IntersectionObserver = original;
    },
  };
}

export function mockMatchMedia(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}
