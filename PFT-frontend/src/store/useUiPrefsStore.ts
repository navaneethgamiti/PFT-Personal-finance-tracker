import { create } from "zustand";

type DateRange = "this-month" | "last-30" | "quarter" | "year";

interface UiPrefsState {
  globalSearch: string;
  dateRange: DateRange;
  setGlobalSearch: (value: string) => void;
  setDateRange: (value: DateRange) => void;
}

export const useUiPrefsStore = create<UiPrefsState>((set) => ({
  globalSearch: "",
  dateRange: "this-month",
  setGlobalSearch: (value) => set({ globalSearch: value }),
  setDateRange: (value) => set({ dateRange: value })
}));