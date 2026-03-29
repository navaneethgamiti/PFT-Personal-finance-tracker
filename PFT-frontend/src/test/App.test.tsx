import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("App", () => {
  it("renders dashboard and can open add transaction modal", async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();

    await user.click(screen.getByTestId("global-add-transaction"));
    expect(screen.getByTestId("add-transaction-modal")).toBeInTheDocument();
  });
});
