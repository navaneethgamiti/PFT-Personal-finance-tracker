import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecurringPage } from "@/features/recurring/RecurringPage";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RecurringPage", () => {
  it("adds recurring item and toggles status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecurringPage />);

    const textInputs = screen.getAllByRole("textbox");
    await user.type(textInputs[0], "Internet Bill");
    const amount = screen.getByRole("spinbutton", { name: /Amount/i });
    await user.type(amount, "999");

    const combos = screen.getAllByRole("combobox");
    await user.selectOptions(combos[0], "a1");
    await user.selectOptions(combos[1], "c2");
    await user.selectOptions(combos[2], "monthly");

    await user.click(screen.getByRole("button", { name: "Save Recurring" }));
    expect(screen.getAllByText("Internet Bill").length).toBeGreaterThan(0);

    const pauseButton = screen.getAllByRole("button", { name: /Pause|Resume/i })[0];
    await user.click(pauseButton);
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });
});
