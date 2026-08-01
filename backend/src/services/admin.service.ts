import type { FilterQuery } from "mongoose";
import { User, type IUser } from "../models/User";
import { Report } from "../models/Report";
import { AuditLog } from "../models/AuditLog";
import { getOrCreateSettings, type ISettings } from "../models/Settings";
import { ApiError } from "../utils/ApiError";
import { paginate, type Paginated } from "../utils/apiResponse";
import { serializeAdminUser, type PublicAdminUser } from "../utils/serializers/adminUser.serializer";
import type { UserRole } from "../types/enums";

interface ListUsersFilters {
  role?: UserRole;
  search?: string;
  page: number;
  limit: number;
}

export async function listUsers(filters: ListUsersFilters): Promise<Paginated<PublicAdminUser>> {
  const query: FilterQuery<IUser> = {};
  if (filters.role) query.role = filters.role;
  if (filters.search) query.$text = { $search: filters.search };

  const skip = (filters.page - 1) * filters.limit;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
    User.countDocuments(query)
  ]);

  const officerIds = users.filter((u) => u.role === "officer").map((u) => u._id);

  // Two aggregations covering every officer on this page, instead of two queries
  // per officer (N+1) — constant query count regardless of page size.
  const [filedCounts, resolvedCounts] = await Promise.all([
    officerIds.length > 0
      ? Report.aggregate<{ _id: unknown; count: number }>([
          { $match: { reportedBy: { $in: officerIds } } },
          { $group: { _id: "$reportedBy", count: { $sum: 1 } } }
        ])
      : [],
    officerIds.length > 0
      ? Report.aggregate<{ _id: unknown; count: number }>([
          { $match: { assignedTo: { $in: officerIds }, status: "resolved" } },
          { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
        ])
      : []
  ]);

  const filedBySlug = new Map(filedCounts.map((row) => [String(row._id), row.count]));
  const resolvedBySlug = new Map(resolvedCounts.map((row) => [String(row._id), row.count]));

  const items = users.map((user) => {
    if (user.role === "officer") {
      return serializeAdminUser(user, {
        reportsFiled: filedBySlug.get(String(user._id)) ?? 0,
        reportsResolved: resolvedBySlug.get(String(user._id)) ?? 0
      });
    }
    return serializeAdminUser(user);
  });

  return paginate(items, total, filters.page, filters.limit);
}

export async function setUserActive(id: string, isActive: boolean): Promise<PublicAdminUser> {
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return serializeAdminUser(user);
}

export async function setUserRole(id: string, role: UserRole): Promise<PublicAdminUser> {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return serializeAdminUser(user);
}

export interface AnalyticsSummary {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  totalUsers: number;
  categoryDistribution: Array<{ category: string; count: number }>;
  monthlyTrends: Array<{ month: string; reports: number; resolved: number }>;
  officerPerformance: Array<{ officerName: string; resolved: number; avgResponseHours: number }>;
}

interface CategoryAggRow {
  _id: string;
  count: number;
}

interface MonthlyAggRow {
  _id: string;
  reports: number;
  resolved: number;
}

interface OfficerAggRow {
  officer: { name: string };
  resolved: number;
  avgResponseMs: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [totalReports, resolvedReports, totalUsers, categoryAgg, monthlyAgg, officerAgg] = await Promise.all([
    Report.countDocuments(),
    Report.countDocuments({ status: "resolved" }),
    User.countDocuments(),
    Report.aggregate<CategoryAggRow>([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Report.aggregate<MonthlyAggRow>([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          reports: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]),
    Report.aggregate<OfficerAggRow>([
      { $match: { assignedTo: { $ne: null }, status: "resolved" } },
      {
        $group: {
          _id: "$assignedTo",
          resolved: { $sum: 1 },
          avgResponseMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } }
        }
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "officer" } },
      { $unwind: "$officer" },
      { $sort: { resolved: -1 } },
      { $limit: 10 }
    ])
  ]);

  const categoryDistribution = categoryAgg.map((row) => ({ category: row._id, count: row.count }));

  const monthlyTrends = monthlyAgg.map((row) => ({
    month: row._id,
    reports: row.reports,
    resolved: row.resolved
  }));

  const officerPerformance = officerAgg.map((row) => ({
    officerName: row.officer.name,
    resolved: row.resolved,
    avgResponseHours: Math.round((row.avgResponseMs / (1000 * 60 * 60)) * 10) / 10
  }));

  return {
    totalReports,
    resolvedReports,
    pendingReports: totalReports - resolvedReports,
    totalUsers,
    categoryDistribution,
    monthlyTrends,
    officerPerformance
  };
}

export interface PublicAuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export async function listAuditLogs(page: number, limit: number): Promise<Paginated<PublicAuditLog>> {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments()
  ]);

  const items = logs.map((log) => ({
    id: log.id,
    actorName: log.actorName,
    actorRole: log.actorRole,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString()
  }));

  return paginate(items, total, page, limit);
}

export interface PublicSettings {
  siteName: string;
  supportEmail: string;
  autoAssignReports: boolean;
  reportResolutionSlaHours: number;
  allowPublicReportSubmission: boolean;
}

function serializeSettings(settings: ISettings): PublicSettings {
  return {
    siteName: settings.siteName,
    supportEmail: settings.supportEmail,
    autoAssignReports: settings.autoAssignReports,
    reportResolutionSlaHours: settings.reportResolutionSlaHours,
    allowPublicReportSubmission: settings.allowPublicReportSubmission
  };
}

export async function getSystemSettings(): Promise<PublicSettings> {
  const settings = await getOrCreateSettings();
  return serializeSettings(settings);
}

export async function updateSystemSettings(updates: PublicSettings): Promise<PublicSettings> {
  const settings = await getOrCreateSettings();
  Object.assign(settings, updates);
  await settings.save();
  return serializeSettings(settings);
}
