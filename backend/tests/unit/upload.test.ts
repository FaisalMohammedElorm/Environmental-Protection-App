jest.mock("../../src/services/upload.service", () => ({
  uploadReportImages: jest.fn().mockResolvedValue(["mock-owner/mock-1.jpg", "mock-owner/mock-2.jpg"]),
  signReportImageUrls: jest.fn((paths: string[]) =>
    Promise.resolve(paths.map((p) => `https://example.supabase.co/storage/v1/object/sign/reports/${p}?token=mock`))
  )
}));

import * as reportService from "../../src/services/report.service";
import { uploadReportImages } from "../../src/services/upload.service";
import { createTestUser } from "../helpers";

describe("report image upload (mocked Supabase Storage)", () => {
  it("stores the URLs returned by the upload service on the report", async () => {
    const citizen = await createTestUser({ role: "citizen" });

    const fakeFile = {
      buffer: Buffer.from("fake-image-bytes"),
      mimetype: "image/jpeg"
    } as Express.Multer.File;

    const report = await reportService.createReport(citizen.id, {
      category: "air_pollution",
      severity: "moderate",
      description: "Thick smoke from a burning tire pile near the school",
      address: "Near Community School",
      latitude: 5.65,
      longitude: -0.19,
      files: [fakeFile, fakeFile]
    });

    expect(uploadReportImages).toHaveBeenCalledWith([fakeFile, fakeFile], citizen.id);
    expect(report.images).toHaveLength(2);
    expect(report.images[0]).toContain("example.supabase.co/storage");
  });
});
