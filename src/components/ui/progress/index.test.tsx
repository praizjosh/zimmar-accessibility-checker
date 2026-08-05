import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Progress from "./index";

function getIndicator() {
  return screen.getByRole("progressbar").firstElementChild as HTMLElement;
}

describe("Progress", () => {
  it("translates the indicator based on value", () => {
    render(<Progress value={40} />);

    expect(getIndicator()).toHaveStyle({ transform: "translateX(-60%)" });
  });

  it("treats a missing value as 0 (fully translated out of view)", () => {
    render(<Progress />);

    expect(getIndicator()).toHaveStyle({ transform: "translateX(-100%)" });
  });

  it("merges indicatorClassName onto the indicator's default classes", () => {
    render(<Progress value={50} indicatorClassName="custom-indicator" />);

    expect(getIndicator()).toHaveClass("custom-indicator", "bg-accent");
  });

  it("merges indicatorStyle alongside the computed transform", () => {
    render(
      <Progress
        value={50}
        indicatorStyle={{ backgroundColor: "rgb(255, 0, 0)" }}
      />,
    );

    expect(getIndicator()).toHaveStyle({
      transform: "translateX(-50%)",
      backgroundColor: "rgb(255, 0, 0)",
    });
  });
});
