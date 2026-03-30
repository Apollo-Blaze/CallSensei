import { deserializeActivities } from "../../src/utils/activityDeSerializer";

describe("activityDeSerializer", () => {
  it("deserializes version=1 exports into models", () => {
    const json = {
      version: 1,
      activities: [
        {
          id: "a1",
          name: "One",
          url: "https://example.com/a",
          request: {
            id: "req1",
            method: "GET",
            url: "https://example.com/a",
            headers: {},
            body: "",
            timestamp: new Date().toISOString(),
            name: "Example",
          },
          response: {
            id: "r1",
            requestId: "req1",
            status: 200,
            statusText: "OK",
            headers: {},
            body: "hello",
            timestamp: new Date().toISOString(),
            duration: 10,
            size: 5,
            isSuccess: true,
          },
          parentId: null,
        },
      ],
      folders: [
        {
          id: "f1",
          name: "Folder 1",
          parentId: null,
        },
      ],
    };

    const { activities, folders } = deserializeActivities(json);
    expect(activities).toHaveLength(1);
    expect(activities[0].id).toBe("a1");
    expect(activities[0].request.url).toBe("https://example.com/a");
    expect(activities[0].response?.status).toBe(200);
    expect(folders).toHaveLength(1);
    expect(folders[0].id).toBe("f1");
  });

  it("throws on unsupported export versions", () => {
    expect(() => deserializeActivities({ version: 2, activities: [], folders: [] })).toThrow(
      "Unsupported export version"
    );
  });
});

