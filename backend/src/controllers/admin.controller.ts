import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as adminService from "../services/admin.service";
import * as auditLogService from "../services/auditLog.service";
import type { UserRole } from "../types/enums";

export const listUsersHandler = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as { role?: UserRole; search?: string; page: number; limit: number };
  const result = await adminService.listUsers(query);
  res.status(200).json(result);
});

export const setUserActiveHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await adminService.setUserActive(id, req.body.isActive);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: req.body.isActive ? "activate_user" : "suspend_user",
    targetType: "User",
    targetId: id
  });

  res.status(200).json(user);
});

export const setUserRoleHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await adminService.setUserRole(id, req.body.role);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "change_user_role",
    targetType: "User",
    targetId: id,
    metadata: { role: req.body.role }
  });

  res.status(200).json(user);
});

export const getAnalyticsSummaryHandler = catchAsync(async (req: Request, res: Response) => {
  const summary = await adminService.getAnalyticsSummary();
  res.status(200).json(summary);
});

export const listAuditLogsHandler = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 25);
  const result = await adminService.listAuditLogs(page, limit);
  res.status(200).json(result);
});

export const getSettingsHandler = catchAsync(async (req: Request, res: Response) => {
  const settings = await adminService.getSystemSettings();
  res.status(200).json(settings);
});

export const updateSettingsHandler = catchAsync(async (req: Request, res: Response) => {
  const settings = await adminService.updateSystemSettings(req.body);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "update_settings",
    targetType: "Settings",
    targetId: "singleton"
  });

  res.status(200).json(settings);
});
