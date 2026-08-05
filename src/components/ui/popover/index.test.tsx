import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./index";

describe("Popover", () => {
  it("shows its content only after the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Popover body")).toBeNull();

    await user.click(screen.getByText("Open"));

    expect(screen.getByText("Popover body")).toBeVisible();
  });

  it("merges a custom className onto the content with its defaults", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="mr-8">Popover body</PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByText("Open"));

    expect(screen.getByText("Popover body")).toHaveClass("mr-8", "rounded-md");
  });
});
