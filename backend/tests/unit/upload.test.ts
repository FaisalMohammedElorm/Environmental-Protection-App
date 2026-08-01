jest.mock("../../src/services/upload.service", () => ({
  uploadReportImages: jest.fn().mockResolvedValue([
    "https://res.cloudinary.com/demo/image/upload/v1/ecoalert/reports/mock-1.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1/ecoalert/reports/mock-2.jpg"
  ])
}));

import * as reportService from "../../src/services/report.service";
import { uploadReportImages } from "../../src/services/upload.service";
import { createTestUser } from "../helpers";

describe("report image upload (mocked Cloudinary)", () => {
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

    expect(uploadReportImages).toHaveBeenCalledWith([fakeFile, fakeFile]);
    expect(report.images).toHaveLength(2);
    expect(report.images[0]).toContain("res.cloudinary.com");
  });
});
