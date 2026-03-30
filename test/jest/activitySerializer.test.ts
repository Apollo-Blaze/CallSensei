import { serializeActivity } from "../../src/utils/activitySerializer";
import { createActivity } from "../../src/models/ActivityModel";
import { createFolder } from "../../src/models/FolderModel";

describe("activitySerializer", () => {
  it("serializeActivity filters by selectedId", () => {
    const reqA = {
      id: "reqA",
      method: "GET" as const,
      url: "https://example.com/a",
      headers: {},
      body: "",
      timestamp: new Date().toISOString(),
    };
    const reqB = {
      id: "reqB",
      method: "POST" as const,
      url: "https://example.com/b",
      headers: {},
      body: "x=1",
      timestamp: new Date().toISOString(),
    };

    const a1 = createActivity("a1", "One", reqA.url, reqA);
    const a2 = createActivity("a2", "Two", reqB.url, reqB);
    const folder = createFolder({ id: "f1", name: "Folder" });

    const json = serializeActivity("a1", [a1, a2], [folder]);
    expect(json.activities).toHaveLength(1);
    expect(json.activities[0].id).toBe("a1");
    expect(json.folders).toHaveLength(1);
  });
});

