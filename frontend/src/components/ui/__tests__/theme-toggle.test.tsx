import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "../theme-toggle";

describe("ThemeToggle", () => {
  it("renders a toggle button after mounting", async () => {
    render(<ThemeToggle />);
    const button = await screen.findByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName();
  });
});
