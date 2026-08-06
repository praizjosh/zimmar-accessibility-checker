import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RadioToggle from "./index";

const options = [
  { value: "one", label: "One", title: "Select one" },
  { value: "two", label: "Two", title: "Select two" },
] as const;

describe("RadioToggle", () => {
  it("renders the label alongside a radiogroup of the given options", () => {
    render(
      <RadioToggle
        value="one"
        onChange={vi.fn()}
        options={options}
        ariaLabel="Example group"
        label={<span>Example</span>}
      />,
    );

    expect(screen.getByText("Example")).toBeVisible();
    expect(
      screen.getByRole("radiogroup", { name: "Example group" }),
    ).toBeVisible();
  });

  it("marks the current value's radio as checked and the other as unchecked", () => {
    render(
      <RadioToggle
        value="two"
        onChange={vi.fn()}
        options={options}
        ariaLabel="Example group"
      />,
    );

    expect(screen.getByRole("radio", { name: "One" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Two" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onChange with the clicked option's value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioToggle
        value="one"
        onChange={onChange}
        options={options}
        ariaLabel="Example group"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Two" }));

    expect(onChange).toHaveBeenCalledWith("two");
  });

  it("only tabs to the checked radio, keeping the other out of the tab sequence", () => {
    render(
      <RadioToggle
        value="one"
        onChange={vi.fn()}
        options={options}
        ariaLabel="Example group"
      />,
    );

    expect(screen.getByRole("radio", { name: "One" })).toHaveAttribute(
      "tabIndex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "Two" })).toHaveAttribute(
      "tabIndex",
      "-1",
    );
  });

  it("moves focus and selection to the next option on ArrowRight, wrapping at the end", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioToggle
        value="two"
        onChange={onChange}
        options={options}
        ariaLabel="Example group"
      />,
    );

    screen.getByRole("radio", { name: "Two" }).focus();
    await user.keyboard("[ArrowRight]");

    expect(onChange).toHaveBeenCalledWith("one");
    expect(screen.getByRole("radio", { name: "One" })).toHaveFocus();
  });

  it("moves focus and selection to the previous option on ArrowLeft, wrapping at the start", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioToggle
        value="one"
        onChange={onChange}
        options={options}
        ariaLabel="Example group"
      />,
    );

    screen.getByRole("radio", { name: "One" }).focus();
    await user.keyboard("[ArrowLeft]");

    expect(onChange).toHaveBeenCalledWith("two");
    expect(screen.getByRole("radio", { name: "Two" })).toHaveFocus();
  });

  it("treats ArrowDown the same as ArrowRight and ArrowUp the same as ArrowLeft", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioToggle
        value="one"
        onChange={onChange}
        options={options}
        ariaLabel="Example group"
      />,
    );

    screen.getByRole("radio", { name: "One" }).focus();
    await user.keyboard("[ArrowDown]");

    expect(onChange).toHaveBeenLastCalledWith("two");
  });

  it("renders without a label when none is passed", () => {
    render(
      <RadioToggle
        value="one"
        onChange={vi.fn()}
        options={options}
        ariaLabel="Example group"
      />,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Example group" }),
    ).toBeVisible();
  });
});
