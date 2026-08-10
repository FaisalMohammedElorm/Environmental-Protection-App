import { serializeComment, type CommentRow, type PublicComment } from "./comment.serializer";

export interface ReportRow {
  id: string;
  category_slug: string;
  description: string;
  severity: string;
  status: string;
  images: string[];
  address: string;
  latitude: number;
  longitude: number;
  reported_by_id: string;
  reported_by_name: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  created_at: Date;
  updated_at: Date;
}

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
  comments: PublicComment[];
  createdAt: string;
  updatedAt: string;
}

export function serializeReport(row: ReportRow, comments: CommentRow[] = []): PublicReport {
  return {
    id: row.id,
    category: row.category_slug,
    description: row.description,
    severity: row.severity,
    status: row.status,
    images: row.images,
    location: { address: row.address, latitude: row.latitude, longitude: row.longitude },
    reportedBy: { id: row.reported_by_id, name: row.reported_by_name },
    assignedTo: row.assigned_to_id ? { id: row.assigned_to_id, name: row.assigned_to_name as string } : undefined,
    comments: comments.map(serializeComment),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}
