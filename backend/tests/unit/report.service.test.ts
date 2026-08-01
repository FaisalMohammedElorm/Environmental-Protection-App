import * as reportService from "../../src/services/report.service";
import { createTestUser } from "../helpers";
import { ApiError } from "../../src/utils/ApiError";
import type { IUser } from "../../src/models/User";

async function createSampleReport(citizen: IUser) {
  return reportService.createReport(citizen.id, {
    category: "illegal_dumping",
    severity: "high",
    description: "A large pile of waste behind the market",
    address: "Behind Awoshie market",
    latitude: 5.6,
    longitude: -0.2,
    files: []
  });
}

describe("report.service", () => {
  describe("createReport", () => {
    it("creates a report owned by the reporter", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);

      expect(report.category).toBe("illegal_dumping");
      expect(report.status).toBe("new");
      expect(report.reportedBy.id).toBe(citizen.id);
      expect(report.comments).toHaveLength(0);
    });
  });

  describe("listReports", () => {
    it("filters by status and category", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);
      await reportService.updateReportStatus(report.id, "resolved");

      const resolved = await reportService.listReports({ status: "resolved", page: 1, limit: 10 });
      expect(resolved.items).toHaveLength(1);

      const newOnly = await reportService.listReports({ status: "new", page: 1, limit: 10 });
      expect(newOnly.items).toHaveLength(0);
    });

    it("scopes results by reportedBy when provided", async () => {
      const citizenA = await createTestUser({ role: "citizen" });
      const citizenB = await createTestUser({ role: "citizen" });
      await createSampleReport(citizenA);
      await createSampleReport(citizenB);

      const mine = await reportService.listReports({ reportedBy: citizenA.id, page: 1, limit: 10 });
      expect(mine.items).toHaveLength(1);
      expect(mine.items[0]?.reportedBy.id).toBe(citizenA.id);
    });

    it("sorts by severity using meaningful rank order, not alphabetical", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      // Deliberately created out of order. Alphabetical order would be:
      // critical, high, low, moderate — which is NOT the order this test expects.
      await reportService.createReport(citizen.id, {
        category: "illegal_dumping",
        severity: "moderate",
        description: "A moderate severity report for sort testing",
        address: "Test Street",
        latitude: 5.6,
        longitude: -0.2,
        files: []
      });
      await reportService.createReport(citizen.id, {
        category: "illegal_dumping",
        severity: "critical",
        description: "A critical severity report for sort testing",
        address: "Test Street",
        latitude: 5.6,
        longitude: -0.2,
        files: []
      });
      await reportService.createReport(citizen.id, {
        category: "illegal_dumping",
        severity: "low",
        description: "A low severity report for sort testing",
        address: "Test Street",
        latitude: 5.6,
        longitude: -0.2,
        files: []
      });

      const ascending = await reportService.listReports({
        sortBy: "severity",
        sortOrder: "asc",
        page: 1,
        limit: 10
      });
      expect(ascending.items.map((r) => r.severity)).toEqual(["low", "moderate", "critical"]);

      const descending = await reportService.listReports({
        sortBy: "severity",
        sortOrder: "desc",
        page: 1,
        limit: 10
      });
      expect(descending.items.map((r) => r.severity)).toEqual(["critical", "moderate", "low"]);
    });

    it("sorts by createdAt ascending when requested", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const first = await createSampleReport(citizen);
      const second = await createSampleReport(citizen);

      const result = await reportService.listReports({ sortBy: "createdAt", sortOrder: "asc", page: 1, limit: 10 });
      expect(result.items.map((r) => r.id)).toEqual([first.id, second.id]);
    });
  });

  describe("assignReport", () => {
    it("assigns to a valid officer and moves status to assigned", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const officer = await createTestUser({ role: "officer" });
      const report = await createSampleReport(citizen);

      const assigned = await reportService.assignReport(report.id, officer.id);
      expect(assigned.assignedTo?.id).toBe(officer.id);
      expect(assigned.status).toBe("assigned");
    });

    it("rejects assignment to a citizen account", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const otherCitizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);

      await expect(reportService.assignReport(report.id, otherCitizen.id)).rejects.toThrow(ApiError);
    });
  });

  describe("deleteReport ownership", () => {
    it("allows the owner to delete their own report", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);

      await expect(
        reportService.deleteReport(report.id, { id: citizen.id, role: "citizen" })
      ).resolves.toBeUndefined();

      await expect(
        reportService.getReportById(report.id, { id: citizen.id, role: "citizen" })
      ).rejects.toThrow(ApiError);
    });

    it("rejects deletion by a different citizen", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const otherCitizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);

      await expect(
        reportService.deleteReport(report.id, { id: otherCitizen.id, role: "citizen" })
      ).rejects.toThrow(ApiError);
    });

    it("allows an admin to delete any report", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const admin = await createTestUser({ role: "admin" });
      const report = await createSampleReport(citizen);

      await expect(
        reportService.deleteReport(report.id, { id: admin.id, role: "admin" })
      ).resolves.toBeUndefined();
    });
  });

  describe("updateReportDetails", () => {
    it("allows the owner to edit a report while still new", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);

      const updated = await reportService.updateReportDetails(
        report.id,
        { id: citizen.id, role: "citizen" },
        { description: "An even larger pile of waste, now blocking the road" }
      );

      expect(updated.description).toContain("blocking the road");
    });

    it("blocks edits once a report is under review", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(citizen);
      await reportService.updateReportStatus(report.id, "under_review");

      await expect(
        reportService.updateReportDetails(
          report.id,
          { id: citizen.id, role: "citizen" },
          { description: "Trying to edit after review has started" }
        )
      ).rejects.toThrow(ApiError);
    });
  });

  describe("addComment", () => {
    it("adds a comment visible on the report", async () => {
      const citizen = await createTestUser({ role: "citizen" });
      const officer = await createTestUser({ role: "officer" });
      const report = await createSampleReport(citizen);

      const updated = await reportService.addComment(
        report.id,
        { id: officer.id, role: "officer" },
        "We've dispatched a team to assess this."
      );

      expect(updated.comments).toHaveLength(1);
      expect(updated.comments[0]?.body).toContain("dispatched");
      expect(updated.comments[0]?.authorRole).toBe("officer");
    });
  });

  describe("report visibility (IDOR protection)", () => {
    it("prevents a citizen from viewing another citizen's report", async () => {
      const owner = await createTestUser({ role: "citizen" });
      const otherCitizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(owner);

      await expect(
        reportService.getReportById(report.id, { id: otherCitizen.id, role: "citizen" })
      ).rejects.toThrow(ApiError);
    });

    it("allows the owning citizen to view their own report", async () => {
      const owner = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(owner);

      await expect(
        reportService.getReportById(report.id, { id: owner.id, role: "citizen" })
      ).resolves.toMatchObject({ id: report.id });
    });

    it("allows officers and admins to view any report", async () => {
      const owner = await createTestUser({ role: "citizen" });
      const officer = await createTestUser({ role: "officer" });
      const report = await createSampleReport(owner);

      await expect(
        reportService.getReportById(report.id, { id: officer.id, role: "officer" })
      ).resolves.toMatchObject({ id: report.id });
    });

    it("prevents a citizen from commenting on another citizen's report", async () => {
      const owner = await createTestUser({ role: "citizen" });
      const otherCitizen = await createTestUser({ role: "citizen" });
      const report = await createSampleReport(owner);

      await expect(
        reportService.addComment(report.id, { id: otherCitizen.id, role: "citizen" }, "Trying to snoop")
      ).rejects.toThrow(ApiError);
    });
  });
});
