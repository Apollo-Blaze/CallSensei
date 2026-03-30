// This module imports Redux `store`, which depends on `import.meta.env` in
// `src/state/githubSlice.ts`. For pure utility testing (encode/filter logic),
// we mock the store module to avoid evaluating that code.
jest.mock("../../src/state/store", () => {
  return {
    store: {
      getState: jest.fn(),
    },
  };
});

describe("githubActivities", () => {
  it("encodeForGitHub encodes ASCII content", async () => {
    const input = "hello world";
    // Dynamic import so mocks apply before module evaluation.
    const { encodeForGitHub } = await import("../../src/utils/githubActivities");
    const encoded = encodeForGitHub(input);
    // For ASCII-only strings, encodeForGitHub ends up equivalent to `btoa(input)`.
    expect(encoded).toBe("aGVsbG8gd29ybGQ=");
  });

  it("filterSelected keeps selected activities and required ancestor folders", async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sha: "sha",
      activities: [
        { id: "a1", name: "A1", url: "", parentId: "f2", request: { id: "r1", method: "GET", url: "", headers: {}, body: "", timestamp: "", name: "" }, response: null },
        { id: "a2", name: "A2", url: "", parentId: "f3", request: { id: "r2", method: "GET", url: "", headers: {}, body: "", timestamp: "", name: "" }, response: null },
      ],
      folders: [
        { id: "f1", name: "F1", parentId: null },
        { id: "f2", name: "F2", parentId: "f1" },
        { id: "f3", name: "F3", parentId: null },
      ],
    };

    const { filterSelected } = await import("../../src/utils/githubActivities");
    const res = filterSelected(data as any, ["a1"]);
    expect(res.activities.map((a) => a.id)).toEqual(["a1"]);
    // a1 is in f2, and f2 has ancestor f1
    expect(res.folders.map((f) => f.id).sort()).toEqual(["f1", "f2"]);
  });
});

