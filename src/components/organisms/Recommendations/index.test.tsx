import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Recommendations from "./index";

describe("Recommendations", () => {
  it("renders nothing when there are no recommendations", () => {
    const { container } = render(<Recommendations recommendations={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single recommendation as a paragraph, not a list, once expanded", async () => {
    const user = userEvent.setup();
    render(<Recommendations recommendations={["Increase the font size."]} />);

    await user.click(screen.getByText("Recommendations"));

    expect(screen.getByText("Increase the font size.")).toBeVisible();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("renders multiple recommendations as a list once expanded", async () => {
    const user = userEvent.setup();
    render(
      <Recommendations
        recommendations={["Increase the font size.", "Improve contrast."]}
      />,
    );

    await user.click(screen.getByText("Recommendations"));

    expect(screen.getByRole("list")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("hides the recommendations list until the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Recommendations
        recommendations={["Increase the font size.", "Improve contrast."]}
      />,
    );

    expect(screen.queryByRole("list")).toBeNull();

    await user.click(screen.getByText("Recommendations"));

    expect(screen.getByRole("list")).toBeVisible();
  });
});
