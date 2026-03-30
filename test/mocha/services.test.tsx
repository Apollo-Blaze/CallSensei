import { describe, it } from "mocha";
import { expect } from "chai";

import { injectService } from "../../src/services/injectService";
import { terminalService } from "../../src/services/terminalService";

describe("services (Mocha)", () => {
  it("injectService.previewPatch returns ok:false when Desktop API is unavailable", async () => {
    const res = await injectService.previewPatch("patch");
    expect(res.ok).to.equal(false);
    expect(res.message).to.match(/Desktop API unavailable/i);
  });

  it("terminalService.spawn returns ok:false when Desktop API is unavailable", async () => {
    const res = await terminalService.spawn("s1", "echo hi");
    expect(res.ok).to.equal(false);
    expect(res.message).to.match(/Desktop API unavailable/i);
  });
});

