import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge, SeverityBadge } from "../badges";

describe("StatusBadge", () => {
  it("renders the human-readable label for each status", () => {
    render(<StatusBadge status="under_review" />);
    expect(screen.getByText("Under review")).toBeInTheDocument();
  });

  it("renders resolved status correctly", () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });
});

describe("SeverityBadge", () => {
  it("renders the severity label", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });
});
