import { JSDOM } from "jsdom";
import { cleanup } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";

// Mocha doesn't provide a jsdom environment automatically.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = dom.window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).document = dom.window.document;
// `navigator` can be a getter in Node; define it safely.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).navigator = dom.window.navigator;
} catch {
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
}

// Some test utilities expect these globals.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).TextDecoder = TextDecoder;

// Cleanup is optional here; this setup file runs before Mocha installs hooks.

