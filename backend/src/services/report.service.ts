import type { FilterQuery, Types } from "mongoose";
import { Report, type IReport } from "../models/Report";
import { Comment } from "../models/Comment";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { ApiError } from "../utils/ApiError";
import { paginate, type Paginated } from "../utils/apiResponse";
import { serializeReport, type PublicReport } from "../utils/serializers/report.serializer";
import { uploadReportImages } from "./upload.service";
import { createNotification } from "./notification.service";
import type { AuthenticatedUser } from "../types/express";
import type { ReportCategory, ReportSeverity, ReportStatus } from "../types/enums";

interface CreateReportInput {
  category: ReportCategory;
  severity: ReportSeverity;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  files: Express.Multer.File[];
}

interface ListReportsFilters {
  status?: ReportStatus;
  category?: ReportCategory;
  severity?: ReportSeverity;
  search?: string;
  sortBy?: "createdAt" | "severity" | "status";
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
  reportedBy?: string;
}

const SEVERITY_RANK: Record<string, number> = { low: 0, moderate: 1, high: 2, critical: 3 };
const STATUS_RANK: Record<string, number> = {
  new: 0,
  under_review: 1,
  assigned: 2,
  in_progress: 3,
  resolved: 4,
  rejected: 5
};

const POPULATE_FIELDS = [
  { path: "reportedBy", select: "name" },
  { path: "assignedTo", select: "name" }
];

// Citizens may only view/interact with reports they filed; officers and admins can access any
// report. Called on every single-report read/write path to prevent IDOR (one citizen reading
// or commenting on another citizen's report by guessing/incrementing its ID).
function assertCanAccessReport(report: IReport, requester: AuthenticatedUser): void {
  if (requester.role === "officer" || requester.role === "admin") return;
  if (report.reportedBy.toString() !== requester.id) {
    throw ApiError.notFound("Report not found");
  }
}

async function withComments(report: IReport): Promise<PublicReport> {
  const comments = await Comment.find({ report: report._id }).populate("author", "name").sort({ createdAt: 1 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serializeReport(report as any, comments as any);
}

async function assertActiveCategory(slug: string): Promise<void> {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) {
    throw ApiError.badRequest(`"${slug}" isn't a recognized, active category`);
  }
}

export async function createReport(reporterId: string, input: CreateReportInput): Promise<PublicReport> {
  await assertActiveCategory(input.category);

  const images = input.files.length > 0 ? await uploadReportImages(input.files) : [];

  const report = await Report.create({
    category: input.category,
    severity: input.severity,
    description: input.description,
    images,
    location: { address: input.address, latitude: input.latitude, longitude: input.longitude },
    reportedBy: reporterId
  });

  const populated = await report.populate(POPULATE_FIELDS);
  return withComments(populated);
}

export async function listReports(filters: ListReportsFilters): Promise<Paginated<PublicReport>> {
  const query: FilterQuery<IReport> = {};

  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.severity) query.severity = filters.severity;
  if (filters.reportedBy) query.reportedBy = filters.reportedBy;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";

  if (sortBy === "createdAt") {
    // The common case stays fully DB-side: sort, skip, and limit all happen in Mongo.
    const skip = (filters.page - 1) * filters.limit;
    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(filters.limit)
        .populate(POPULATE_FIELDS),
      Report.countDocuments(query)
    ]);

    const items = await Promise.all(reports.map((report) => withComments(report)));
    return paginate(items, total, filters.page, filters.limit);
  }

  // severity/status have a meaningful order (low < moderate < high < critical; new < ... <
  // resolved) that isn't alphabetical, so Mongo's plain .sort() can't express it without an
  // aggregation. Filtering happens at the DB level first to keep the working set bounded,
  // then rank + paginate happen in memory.
  const rankMap = sortBy === "severity" ? SEVERITY_RANK : STATUS_RANK;
  const direction = sortOrder === "asc" ? 1 : -1;

  const allMatching = await Report.find(query).populate(POPULATE_FIELDS);
  const sorted = allMatching.sort((a, b) => {
    const rankA = rankMap[sortBy === "severity" ? a.severity : a.status] ?? 0;
    const rankB = rankMap[sortBy === "severity" ? b.severity : b.status] ?? 0;
    return (rankA - rankB) * direction;
  });

  const total = sorted.length;
  const start = (filters.page - 1) * filters.limit;
  const pageSlice = sorted.slice(start, start + filters.limit);

  const items = await Promise.all(pageSlice.map((report) => withComments(report)));
  return paginate(items, total, filters.page, filters.limit);
}

export async function getReportById(id: string, requester: AuthenticatedUser): Promise<PublicReport> {
  const report = await Report.findById(id).populate(POPULATE_FIELDS);
  if (!report) throw ApiError.notFound("Report not found");
  assertCanAccessReport(report, requester);
  return withComments(report);
}

async function assertReportExists(id: string): Promise<IReport> {
  const report = await Report.findById(id);
  if (!report) throw ApiError.notFound("Report not found");
  return report;
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<PublicReport> {
  const report = await assertReportExists(id);
  report.status = status;
  await report.save();

  await createNotification({
    user: report.reportedBy,
    type: "report_status_changed",
    title: "Your report status changed",
    body: `Report ${report.id} is now "${status.replace(/_/g, " ")}"`,
    relatedReport: report.id
  });

  const populated = await report.populate(POPULATE_FIELDS);
  return withComments(populated);
}

export async function assignReport(id: string, officerId: string): Promise<PublicReport> {
  const report = await assertReportExists(id);

  const officer = await User.findOne({ _id: officerId, role: { $in: ["officer", "admin"] } });
  if (!officer) throw ApiError.badRequest("That user isn't a valid officer");

  report.assignedTo = officer._id as Types.ObjectId;
  if (report.status === "new" || report.status === "under_review") {
    report.status = "assigned";
  }
  await report.save();

  await createNotification({
    user: report.reportedBy,
    type: "report_assigned",
    title: "Your report was assigned",
    body: `Report ${report.id} was assigned to ${officer.name}`,
    relatedReport: report.id
  });

  const populated = await report.populate(POPULATE_FIELDS);
  return withComments(populated);
}

export async function updateReportDetails(
  id: string,
  requester: AuthenticatedUser,
  updates: Partial<Pick<CreateReportInput, "category" | "severity" | "description" | "address">>
): Promise<PublicReport> {
  const report = await assertReportExists(id);

  const isOwner = report.reportedBy.toString() === requester.id;
  if (!isOwner && requester.role !== "admin") {
    throw ApiError.forbidden("You can only edit your own reports");
  }
  if (report.status !== "new" && requester.role !== "admin") {
    throw ApiError.badRequest("This report is already being reviewed and can no longer be edited");
  }

  if (updates.category) {
    await assertActiveCategory(updates.category);
    report.category = updates.category;
  }
  if (updates.severity) report.severity = updates.severity;
  if (updates.description) report.description = updates.description;
  if (updates.address) report.location.address = updates.address;

  await report.save();

  const populated = await report.populate(POPULATE_FIELDS);
  return withComments(populated);
}

export async function deleteReport(id: string, requester: AuthenticatedUser): Promise<void> {
  const report = await assertReportExists(id);

  const isOwner = report.reportedBy.toString() === requester.id;
  if (!isOwner && requester.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own reports");
  }

  await Comment.deleteMany({ report: report._id });
  await report.deleteOne();
}

export async function addComment(
  reportId: string,
  author: AuthenticatedUser,
  body: string
): Promise<PublicReport> {
  const report = await assertReportExists(reportId);
  assertCanAccessReport(report, author);

  await Comment.create({ report: report._id, author: author.id, authorRole: author.role, body });

  if (author.id !== report.reportedBy.toString()) {
    await createNotification({
      user: report.reportedBy,
      type: "report_comment",
      title: "New comment on your report",
      body: `Someone commented on report ${report.id}`,
      relatedReport: report.id
    });
  }

  const populated = await report.populate(POPULATE_FIELDS);
  return withComments(populated);
}
