import "@testing-library/jest-dom";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  // @ts-expect-error - jsdom mock
  global.ResizeObserver = MockResizeObserver;
}

if (!HTMLElement.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.scrollIntoView = () => {};
}

