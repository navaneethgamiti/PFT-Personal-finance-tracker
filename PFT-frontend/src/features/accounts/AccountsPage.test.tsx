import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("AccountsPage", () => {
  it("adds account and category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPage />);

    const nameInputs = screen.getAllByLabelText("Name");
    await user.type(nameInputs[0], "Travel Wallet");
    await user.type(screen.getByLabelText("Institution"), "Demo Bank");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(screen.getByText("Travel Wallet")).toBeInTheDocument();

    await user.type(nameInputs[1], "Coffee");
    await user.type(screen.getByLabelText("Color"), "#a16207");
    await user.type(screen.getByLabelText("Icon"), "CoffeeIcon");
    await user.click(screen.getByRole("button", { name: "Add Category" }));

    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });
});
