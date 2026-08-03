import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
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
  const matchStage: FilterQuery<IReport> = {};

  if (filters.status) matchStage.status = filters.status;
  if (filters.category) matchStage.category = filters.category;
  if (filters.severity) matchStage.severity = filters.severity;
  if (filters.reportedBy) matchStage.reportedBy = new Types.ObjectId(filters.reportedBy);
  if (filters.search) matchStage.$text = { $search: filters.search };

  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";
  const sortDir = sortOrder === "asc" ? 1 : -1;
  const skip = (filters.page - 1) * filters.limit;

  if (sortBy === "createdAt") {
    // Fully DB-side: sort → skip → limit → populate, no data loaded into memory.
    const [reports, total] = await Promise.all([
      Report.find(matchStage)
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(filters.limit)
        .populate(POPULATE_FIELDS),
      Report.countDocuments(matchStage)
    ]);

    const items = await Promise.all(reports.map((r) => withComments(r)));
    return paginate(items, total, filters.page, filters.limit);
  }

  // severity and status have a meaningful ordinal rank that isn't alphabetical.
  // We inject a numeric _rank field via $addFields so MongoDB can sort natively
  // without pulling the entire result set into Node.js memory.
  const rankExpression =
    sortBy === "severity"
      ? {
          $switch: {
            branches: [
              { case: { $eq: ["$severity", "low"] }, then: 0 },
              { case: { $eq: ["$severity", "moderate"] }, then: 1 },
              { case: { $eq: ["$severity", "high"] }, then: 2 },
              { case: { $eq: ["$severity", "critical"] }, then: 3 }
            ],
            default: 0
          }
        }
      : {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "new"] }, then: 0 },
              { case: { $eq: ["$status", "under_review"] }, then: 1 },
              { case: { $eq: ["$status", "assigned"] }, then: 2 },
              { case: { $eq: ["$status", "in_progress"] }, then: 3 },
              { case: { $eq: ["$status", "resolved"] }, then: 4 },
              { case: { $eq: ["$status", "rejected"] }, then: 5 }
            ],
            default: 0
          }
        };

  // Aggregation: match → addFields(rank) → sort → facet(data+count in one round-trip)
  // $lookup replaces .populate() for reportedBy / assignedTo.
  const [agg] = await Report.aggregate<{
    data: IReport[];
    total: { count: number }[];
  }>([
    { $match: matchStage },
    { $addFields: { _rank: rankExpression } },
    { $sort: { _rank: sortDir } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: filters.limit },
          {
            $lookup: {
              from: "users",
              localField: "reportedBy",
              foreignField: "_id",
              as: "reportedBy",
              pipeline: [{ $project: { name: 1 } }]
            }
          },
          { $unwind: { path: "$reportedBy", preserveNullAndEmptyArrays: false } },
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignedTo",
              pipeline: [{ $project: { name: 1 } }]
            }
          },
          {
            $unwind: {
              path: "$assignedTo",
              preserveNullAndEmptyArrays: true
            }
          }
        ],
        total: [{ $count: "count" }]
      }
    }
  ]);

  const total = agg?.total[0]?.count ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await Promise.all((agg?.data ?? []).map((r) => withComments(r as any)));
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
