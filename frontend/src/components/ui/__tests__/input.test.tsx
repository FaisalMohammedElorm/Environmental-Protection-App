import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../input";

describe("Input", () => {
  it("renders a label associated with the input", () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  it("shows an error message and marks the field invalid", () => {
    render(<Input label="Email" name="email" error="Enter a valid email" />);
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a hint when no error is present", () => {
    render(<Input label="Password" name="password" hint="At least 8 characters" />);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  });

  it("calls onChange as the user types", () => {
    const onChange = vi.fn();
    render(<Input label="Name" name="name" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ama" } });
    expect(onChange).toHaveBeenCalled();
  });
});
