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
			<Recommendations recommendations={["Increase the font size.", "Improve contrast."]} />,
		);

		await user.click(screen.getByText("Recommendations"));

		expect(screen.getByRole("list")).toBeVisible();
		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});

	it("hides the recommendations list until the trigger is clicked", async () => {
		const user = userEvent.setup();
		render(
			<Recommendations recommendations={["Increase the font size.", "Improve contrast."]} />,
		);

		expect(screen.queryByRole("list")).toBeNull();

		await user.click(screen.getByText("Recommendations"));

		expect(screen.getByRole("list")).toBeVisible();
	});

	describe("citation", () => {
		const citation = {
			exact: true,
			citation: "WCAG 1.4.3 Contrast (Minimum) (AA)",
			url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
		};

		it("does not render a citation link when none is given", () => {
			render(<Recommendations recommendations={["Improve contrast."]} />);

			expect(screen.queryByRole("link")).toBeNull();
		});

		it("renders the citation as a link even while the recommendations list is collapsed", () => {
			render(
				<Recommendations
					recommendations={["Improve contrast.", "Use a larger font size."]}
					citation={citation}
				/>,
			);

			const link = screen.getByRole("link", { name: "WCAG 1.4.3 Contrast (Minimum) (AA)" });
			expect(link).toBeVisible();
			expect(screen.queryByRole("list")).toBeNull();
		});

		it("points the citation link at the official source with a safe target", () => {
			render(<Recommendations recommendations={["Improve contrast."]} citation={citation} />);

			const link = screen.getByRole("link", { name: "WCAG 1.4.3 Contrast (Minimum) (AA)" });
			expect(link).toHaveAttribute(
				"href",
				"https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
			);
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		});

		it("clicking the citation link does not also toggle the recommendations list open", async () => {
			const user = userEvent.setup();
			render(
				<Recommendations
					recommendations={["Improve contrast.", "Use a larger font size."]}
					citation={citation}
				/>,
			);

			await user.click(
				screen.getByRole("link", { name: "WCAG 1.4.3 Contrast (Minimum) (AA)" }),
			);

			expect(screen.queryByRole("list")).toBeNull();
		});
	});
});
