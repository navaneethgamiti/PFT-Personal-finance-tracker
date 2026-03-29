import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("TransactionsPage", () => {
  it("filters transactions by merchant search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsPage />);

    expect(screen.getAllByText("Grocery Mart").length).toBeGreaterThan(0);

    await user.type(screen.getByTestId("transactions-search"), "uber");

    expect(screen.queryAllByText("Grocery Mart").length).toBe(0);
    expect(screen.getAllByText("Uber").length).toBeGreaterThan(0);
  });
});
