import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TargetLevelToggle from "./index";

describe("TargetLevelToggle", () => {
  it("renders the label alongside the AA/AAA radio group", () => {
    render(
      <TargetLevelToggle
        value="AA"
        onChange={vi.fn()}
        label={<span>WCAG target</span>}
      />,
    );

    expect(screen.getByText("WCAG target")).toBeVisible();
    expect(
      screen.getByRole("radiogroup", { name: "Target compliance level" }),
    ).toBeVisible();
  });

  it("marks the current value's radio as checked and the other as unchecked", () => {
    render(<TargetLevelToggle value="AAA" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "AA" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "AAA" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onChange with the clicked level", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetLevelToggle value="AA" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "AAA" }));

    expect(onChange).toHaveBeenCalledWith("AAA");
  });

  it("renders without a label when none is passed", () => {
    render(<TargetLevelToggle value="AA" onChange={vi.fn()} />);

    expect(
      screen.getByRole("radiogroup", { name: "Target compliance level" }),
    ).toBeVisible();
  });

  it("only tabs to the checked radio, keeping the other out of the tab sequence", () => {
    render(<TargetLevelToggle value="AA" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "AA" })).toHaveAttribute(
      "tabIndex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "AAA" })).toHaveAttribute(
      "tabIndex",
      "-1",
    );
  });

  it("moves focus and selection to the next radio on ArrowRight, wrapping at the end", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetLevelToggle value="AAA" onChange={onChange} />);

    screen.getByRole("radio", { name: "AAA" }).focus();
    await user.keyboard("[ArrowRight]");

    expect(onChange).toHaveBeenCalledWith("AA");
    expect(screen.getByRole("radio", { name: "AA" })).toHaveFocus();
  });

  it("moves focus and selection to the previous radio on ArrowLeft, wrapping at the start", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetLevelToggle value="AA" onChange={onChange} />);

    screen.getByRole("radio", { name: "AA" }).focus();
    await user.keyboard("[ArrowLeft]");

    expect(onChange).toHaveBeenCalledWith("AAA");
    expect(screen.getByRole("radio", { name: "AAA" })).toHaveFocus();
  });

  it("treats ArrowDown the same as ArrowRight and ArrowUp the same as ArrowLeft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TargetLevelToggle value="AA" onChange={onChange} />);

    screen.getByRole("radio", { name: "AA" }).focus();
    await user.keyboard("[ArrowDown]");

    expect(onChange).toHaveBeenLastCalledWith("AAA");
  });
});
