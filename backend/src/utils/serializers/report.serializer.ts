import type { IReport } from "../../models/Report";
import type { IUser } from "../../models/User";
import type { IComment } from "../../models/Comment";
import { serializeComment } from "./comment.serializer";

export interface PublicReport {
  id: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  images: string[];
  location: { address: string; latitude: number; longitude: number };
  reportedBy: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  comments: ReturnType<typeof serializeComment>[];
  createdAt: string;
  updatedAt: string;
}

type PopulatedReport = IReport & { reportedBy: IUser; assignedTo?: IUser };

export function serializeReport(
  report: PopulatedReport,
  comments: (IComment & { author: IUser })[] = []
): PublicReport {
  return {
    id: report.id,
    category: report.category,
    description: report.description,
    severity: report.severity,
    status: report.status,
    images: report.images,
    location: report.location,
    reportedBy: { id: report.reportedBy.id, name: report.reportedBy.name },
    assignedTo: report.assignedTo ? { id: report.assignedTo.id, name: report.assignedTo.name } : undefined,
    comments: comments.map(serializeComment),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString()
  };
}
