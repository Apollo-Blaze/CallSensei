import { injectService } from "../../src/services/injectService";
import { terminalService } from "../../src/services/terminalService";

describe("services", () => {
  describe("injectService", () => {
    it("returns ok:false when Desktop API is unavailable", async () => {
      // In Jest/jsdom, window.api is expected to be undefined.
      const res = await injectService.previewPatch("patch");
      expect(res.ok).toBe(false);
      expect(res.message).toMatch(/Desktop API unavailable/i);
    });
  });

  describe("terminalService", () => {
    it("spawn returns ok:false when Desktop API is unavailable", async () => {
      const res = await terminalService.spawn("s1", "echo hi");
      expect(res.ok).toBe(false);
      expect(res.message).toMatch(/Desktop API unavailable/i);
    });

    it("write returns ok:false when Desktop API is unavailable", async () => {
      const res = await terminalService.write("s1", "hello");
      expect(res.ok).toBe(false);
    });

    it("kill returns ok:false when Desktop API is unavailable", async () => {
      const res = await terminalService.kill("s1");
      expect(res.ok).toBe(false);
    });
  });
});

