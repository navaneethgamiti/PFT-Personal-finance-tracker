import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("GoalsPage", () => {
  it("adds a goal and contributes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GoalsPage />);

    await user.type(screen.getByTestId("goal-name"), "Laptop Fund");
    await user.type(screen.getByTestId("goal-target"), "50000");
    await user.type(screen.getByTestId("goal-date"), "2026-12-31");
    await user.click(screen.getByTestId("save-goal-button"));

    expect(screen.getByText("Laptop Fund")).toBeInTheDocument();

    const contributeButtons = screen.getAllByRole("button", { name: /Contribution/i });
    await user.click(contributeButtons[0]);

    expect(screen.getByText(/₹4,300.00/i)).toBeInTheDocument();
  });
});
