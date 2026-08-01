import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import * as reportService from "../services/report.service";
import * as auditLogService from "../services/auditLog.service";
import type { ReportCategory, ReportSeverity, ReportStatus } from "../types/enums";

export const createReportHandler = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const body = req.body as {
    category: ReportCategory;
    severity: ReportSeverity;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
  };

  const report = await reportService.createReport(req.user!.id, { ...body, files });
  res.status(201).json(report);
});

export const listReportsHandler = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    status?: ReportStatus;
    category?: ReportCategory;
    severity?: ReportSeverity;
    search?: string;
    sortBy?: "createdAt" | "severity" | "status";
    sortOrder?: "asc" | "desc";
    page: number;
    limit: number;
  };

  const result = await reportService.listReports(query);
  res.status(200).json(result);
});

export const listMyReportsHandler = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    status?: ReportStatus;
    category?: ReportCategory;
    severity?: ReportSeverity;
    search?: string;
    sortBy?: "createdAt" | "severity" | "status";
    sortOrder?: "asc" | "desc";
    page: number;
    limit: number;
  };

  const result = await reportService.listReports({ ...query, reportedBy: req.user!.id });
  res.status(200).json(result);
});

export const getReportHandler = catchAsync(async (req: Request, res: Response) => {
  const report = await reportService.getReportById(req.params.id as string, req.user!);
  res.status(200).json(report);
});

export const updateReportStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const report = await reportService.updateReportStatus(id, req.body.status);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "update_status",
    targetType: "Report",
    targetId: id,
    metadata: { status: req.body.status }
  });

  res.status(200).json(report);
});

export const assignReportHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const report = await reportService.assignReport(id, req.body.officerId);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "assign_report",
    targetType: "Report",
    targetId: id,
    metadata: { officerId: req.body.officerId }
  });

  res.status(200).json(report);
});

export const updateReportHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const report = await reportService.updateReportDetails(id, req.user!, req.body);
  res.status(200).json(report);
});

export const deleteReportHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await reportService.deleteReport(id, req.user!);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "delete_report",
    targetType: "Report",
    targetId: id
  });

  res.status(204).send();
});

export const addCommentHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const id = req.params.id as string;
  const report = await reportService.addComment(id, req.user, req.body.body);
  res.status(201).json(report);
});
