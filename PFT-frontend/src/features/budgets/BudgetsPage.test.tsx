import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetsPage } from "@/features/budgets/BudgetsPage";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("BudgetsPage", () => {
  it("creates a budget", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetsPage />);

    await user.selectOptions(screen.getByTestId("budget-category"), "c4");
    await user.type(screen.getByTestId("budget-amount"), "1000");
    await user.click(screen.getByTestId("save-budget-button"));

    expect(screen.getByText(/₹1,000.00/i)).toBeInTheDocument();
  });
});
