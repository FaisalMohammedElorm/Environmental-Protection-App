"use client";

import { useParams } from "next/navigation";
import { StaffReportDetail } from "@/components/reports/staff-report-detail";

export default function AdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  return <StaffReportDetail reportId={params.id} mode="admin" backHref="/admin/reports" />;
}
