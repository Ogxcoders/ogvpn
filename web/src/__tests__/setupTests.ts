import '@testing-library/jest-dom/vitest';

// jsdom lacks EventSource; tests never open a real stream, but modules
// reference it at import time in some paths.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: unknown) => void) | null = null;
  addEventListener() {}
  close() {}
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
}

// @ts-expect-error test shim
globalThis.EventSource = FakeEventSource;

afterEach(() => {
  FakeEventSource.instances.length = 0;
  localStorage.clear();
  vi.restoreAllMocks();
});
