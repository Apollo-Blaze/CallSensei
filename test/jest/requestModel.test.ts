import {
  isValidUrl,
  REQUEST_METHODS,
  validateRequestModel,
} from "../../src/models/RequestModel";

describe("RequestModel", () => {
  it("isValidUrl validates URLs using URL()", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("validateRequestModel reports invalid method and required url", () => {
    const errors = validateRequestModel({
      method: "FETCH" as any,
      url: "",
    });
    expect(errors).toContain("Invalid HTTP method");
    expect(errors).toContain("URL is required");
  });

  it("validateRequestModel reports invalid URL format", () => {
    const errors = validateRequestModel({
      method: "GET",
      url: "not-a-url",
    });
    expect(errors).toContain("Invalid URL format");
  });

  it("REQUEST_METHODS contains typical verbs", () => {
    expect(REQUEST_METHODS).toEqual(
      expect.arrayContaining(["GET", "POST", "PUT", "DELETE", "PATCH"])
    );
  });
});

