"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { getCategories } from "@/lib/api/categories";
import {
  statusLabels,
  type ReportListParams,
  type ReportSeverity,
  type ReportStatus
} from "@/types/report";

export interface ReportFilterValues {
  status: ReportStatus | "all";
  category: string;
  severity: ReportSeverity | "";
  assignedTo: string;
  createdFrom: string;
  createdTo: string;
  search: string;
  sort: SortValue;
}

type SortValue = "newest" | "oldest" | "severity-desc" | "severity-asc";

const sortOptions: Array<{
  value: SortValue;
  sortBy: "createdAt" | "severity";
  sortOrder: "asc" | "desc";
  label: string;
}> = [
  { value: "newest", sortBy: "createdAt", sortOrder: "desc", label: "Newest first" },
  { value: "oldest", sortBy: "createdAt", sortOrder: "asc", label: "Oldest first" },
  { value: "severity-desc", sortBy: "severity", sortOrder: "desc", label: "Most severe first" },
  { value: "severity-asc", sortBy: "severity", sortOrder: "asc", label: "Least severe first" }
];

const statusFilters: Array<{ value: ReportStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  ...(Object.keys(statusLabels) as ReportStatus[]).map((value) => ({
    value,
    label: statusLabels[value]
  }))
];

const severityOptions: ReportSeverity[] = ["low", "moderate", "high", "critical"];

export const defaultReportFilters: ReportFilterValues = {
  status: "all",
  category: "",
  severity: "",
  assignedTo: "",
  createdFrom: "",
  createdTo: "",
  search: "",
  sort: "newest"
};

export function toReportListParams(values: ReportFilterValues): ReportListParams {
  const sort = sortOptions.find((o) => o.value === values.sort) ?? sortOptions[0]!;
  return {
    status: values.status === "all" ? undefined : values.status,
    category: values.category || undefined,
    severity: values.severity || undefined,
    assignedTo: values.assignedTo || undefined,
    createdFrom: values.createdFrom || undefined,
    createdTo: values.createdTo || undefined,
    search: values.search.trim() || undefined,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder
  };
}

const fieldClass =
  "w-full rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-3 py-2 text-sm text-canopy-800 dark:text-canopy-100 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20";

interface ReportFiltersProps {
  value: ReportFilterValues;
  onChange: (next: ReportFilterValues) => void;
  /** When provided, shows an "Assigned officer" filter (admin view). */
  officers?: Array<{ id: string; name: string }>;
}

export function ReportFilters({ value, onChange, officers }: ReportFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(value.search);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const activeCategories = (categories ?? []).filter((c) => c.isActive);

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    if (searchDraft === value.search) return;
    const timer = setTimeout(() => onChange({ ...value, search: searchDraft }), 350);
    return () => clearTimeout(timer);
  }, [searchDraft, value, onChange]);

  const set = <K extends keyof ReportFilterValues>(key: K, next: ReportFilterValues[K]) =>
    onChange({ ...value, [key]: next });

  const hasActiveFilters =
    value.category !== "" ||
    value.severity !== "" ||
    value.assignedTo !== "" ||
    value.createdFrom !== "" ||
    value.createdTo !== "" ||
    value.search !== "" ||
    value.status !== "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => set("status", filter.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              value.status === filter.value
                ? "bg-canopy-700 text-paper"
                : "border border-canopy-100 text-canopy-600 hover:border-canopy-700 dark:border-canopy-700 dark:text-canopy-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="card grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canopy-300 dark:text-canopy-600" />
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search description or location"
            className={`${fieldClass} pl-9`}
          />
        </label>

        <label>
          <span className="sr-only">Category</span>
          <select
            value={value.category}
            onChange={(e) => set("category", e.target.value)}
            className={fieldClass}
          >
            <option value="">All categories</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Severity</span>
          <select
            value={value.severity}
            onChange={(e) => set("severity", e.target.value as ReportFilterValues["severity"])}
            className={`${fieldClass} capitalize`}
          >
            <option value="">All severities</option>
            {severityOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {officers && (
          <label>
            <span className="sr-only">Assigned officer</span>
            <select
              value={value.assignedTo}
              onChange={(e) => set("assignedTo", e.target.value)}
              className={fieldClass}
            >
              <option value="">Any officer</option>
              <option value="unassigned">Unassigned</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span className="sr-only">Sort</span>
          <select
            value={value.sort}
            onChange={(e) => set("sort", e.target.value as SortValue)}
            className={fieldClass}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-canopy-500 dark:text-canopy-400">
            Submitted from
          </span>
          <input
            type="date"
            value={value.createdFrom}
            max={value.createdTo || undefined}
            onChange={(e) => set("createdFrom", e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-canopy-500 dark:text-canopy-400">
            Submitted to
          </span>
          <input
            type="date"
            value={value.createdTo}
            min={value.createdFrom || undefined}
            onChange={(e) => set("createdTo", e.target.value)}
            className={fieldClass}
          />
        </label>

        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchDraft("");
                onChange({ ...defaultReportFilters, sort: value.sort });
              }}
              className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-canopy-600 hover:text-canopy-800 dark:text-canopy-300 dark:hover:text-canopy-100"
            >
              <X className="h-4 w-4" /> Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
