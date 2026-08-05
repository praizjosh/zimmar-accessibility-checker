import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import InfoPopover from "./index";

describe("InfoPopover", () => {
  it("shows the content but no heading when no title is given", async () => {
    const user = userEvent.setup();
    render(<InfoPopover content="Some explanatory text" />);

    await user.click(screen.getByLabelText("More info"));

    expect(screen.getByText("Some explanatory text")).toBeVisible();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("shows a heading and an 'About <title>' trigger label when a title is given", async () => {
    const user = userEvent.setup();
    render(<InfoPopover title="Contrast Detection" content="Details" />);

    const trigger = screen.getByLabelText("About Contrast Detection");
    await user.click(trigger);

    expect(
      screen.getByRole("heading", { name: "Contrast Detection" }),
    ).toBeVisible();
    expect(screen.getByText("Details")).toBeVisible();
  });

  it("aligns to the end of the trigger by default", async () => {
    const user = userEvent.setup();
    render(<InfoPopover content="Details" />);

    await user.click(screen.getByLabelText("More info"));

    expect(screen.getByText("Details").closest("[data-align]")).toHaveAttribute(
      "data-align",
      "end",
    );
  });

  it("uses the given align override instead of the default", async () => {
    const user = userEvent.setup();
    render(<InfoPopover content="Details" align="start" />);

    await user.click(screen.getByLabelText("More info"));

    expect(screen.getByText("Details").closest("[data-align]")).toHaveAttribute(
      "data-align",
      "start",
    );
  });
});
