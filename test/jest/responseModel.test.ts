import {
  createResponse,
  getResponseStatusCategory,
  isSuccessfulResponse,
  validateResponseModel,
} from "../../src/models/ResponseModel";

describe("ResponseModel", () => {
  it("getResponseStatusCategory maps status codes to categories", () => {
    expect(getResponseStatusCategory(200)).toBe("success");
    expect(getResponseStatusCategory(404)).toBe("client_error");
    expect(getResponseStatusCategory(500)).toBe("server_error");
    // network/other bucket
    expect(getResponseStatusCategory(0)).toBe("network_error");
  });

  it("isSuccessfulResponse matches 2xx logic", () => {
    expect(isSuccessfulResponse(204)).toBe(true);
    expect(isSuccessfulResponse(302)).toBe(false);
  });

  it("validateResponseModel returns helpful errors for missing fields", () => {
    const errors = validateResponseModel({
      requestId: "",
      status: -1,
      statusText: "",
      duration: -5,
    });
    expect(errors).toContain("Request ID is required");
    expect(errors).toContain("Invalid status code");
    expect(errors).toContain("Status text is required");
    expect(errors).toContain("Invalid duration");
  });

  it("createResponse sets isSuccess based on status", () => {
    const resp = createResponse({
      requestId: "req1",
      status: 201,
      statusText: "Created",
      headers: { "content-type": "text/plain" },
      body: "ok",
      duration: 120,
      size: 2,
    });
    expect(resp.isSuccess).toBe(true);
    expect(resp.contentType).toBeUndefined();
  });
});

