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
  HTMLElement.prototype.scrollIntoView = function scrollIntoViewMock() {
    // jsdom mock - no behavior required for tests
    return undefined;
  };
}
