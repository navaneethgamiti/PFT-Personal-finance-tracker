import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeftStartOnRectangleIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  Bars3Icon,
  BellIcon,
  CalendarDaysIcon,
  ClockIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  FlagIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RectangleGroupIcon,
  ScaleIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logOut } from "@/store/slices/authSlice";
import { setAddTransactionModalOpen } from "@/store/slices/uiSlice";
import { Button } from "@/components/ui/button";
import { useUiPrefsStore } from "@/store/useUiPrefsStore";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { path: "/transactions", label: "Transactions", icon: BanknotesIcon },
  { path: "/budgets", label: "Budgets", icon: ScaleIcon },
  { path: "/goals", label: "Goals", icon: FlagIcon },
  { path: "/reports", label: "Reports", icon: ArrowTrendingUpIcon },
  { path: "/insights", label: "Insights", icon: RectangleGroupIcon },
  { path: "/recurring", label: "Recurring", icon: ClockIcon },
  { path: "/accounts", label: "Accounts", icon: CreditCardIcon },
  { path: "/rules", label: "Rules", icon: Bars3Icon },
  { path: "/family", label: "Family", icon: UserGroupIcon },
  { path: "/settings", label: "Settings", icon: Cog6ToothIcon }
];

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { dateRange, globalSearch, setDateRange, setGlobalSearch } = useUiPrefsStore();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="app-shell" data-testid="app-shell">
      <motion.aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`} initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <div className="mobile-nav-header">
          <div className="brand mb-0">Personal Finance Tracker</div>
          <Button type="button" variant="secondary" size="icon" className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <XMarkIcon width={18} />
          </Button>
        </div>
        <div className="brand">
          <div className="logo-chip">P</div>
          <span className="brand-label">Personal Finance Tracker</span>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon width={18} />
                <span className="nav-label">{item.label}</span>
                <span className="nav-tooltip">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </motion.aside>
      {isMobileMenuOpen ? <button type="button" className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu backdrop" /> : null}

      <main className={`main-area ${isDashboard ? "dashboard-main" : ""}`}>
        {isDashboard ? null : <header className="top-bar">
          <div className="top-bar-left">
            <Button type="button" variant="secondary" size="icon" className="mobile-menu-toggle md:hidden" onClick={() => setIsMobileMenuOpen(true)} data-testid="mobile-menu-toggle" aria-label="Open menu">
              <Bars3Icon width={18} />
            </Button>
            <div>
              <div className="text-xs text-slate-500">Current view</div>
              <strong className="capitalize">{location.pathname.replace("/", "")}</strong>
            </div>
          </div>

          <div className="hidden min-w-[220px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
            <MagnifyingGlassIcon width={16} className="text-slate-400" />
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search transactions, merchants, tags"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>

          <div className="controls mb-0">
            <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 sm:flex">
              <CalendarDaysIcon width={14} className="text-slate-500" />
              <select value={dateRange} onChange={(event) => setDateRange(event.target.value as typeof dateRange)} className="bg-transparent text-xs font-medium text-slate-700 outline-none">
                <option value="this-month">This Month</option>
                <option value="last-30">Last 30 Days</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <Button type="button" variant="secondary" size="icon" aria-label="Notifications">
              <BellIcon width={16} />
            </Button>

            <Button type="button" variant="secondary" onClick={() => dispatch(setAddTransactionModalOpen(true))} data-testid="global-add-transaction">
              Add Transaction
            </Button>

            <Button type="button" variant="secondary" className="hidden md:inline-flex">
              <UserCircleIcon width={16} className="mr-1.5" />
              {user?.displayName}
            </Button>

            <Button type="button" variant="secondary" onClick={() => dispatch(logOut())} data-testid="logout-button">
              <ArrowLeftStartOnRectangleIcon width={16} className="mr-1.5" />
              Log Out
            </Button>
          </div>
        </header>}

        {isDashboard ? (
          <div className="mb-3 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="icon" className="mobile-menu-toggle md:hidden" onClick={() => setIsMobileMenuOpen(true)} data-testid="mobile-menu-toggle" aria-label="Open menu">
              <Bars3Icon width={18} />
            </Button>
            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 lg:flex">
              <MagnifyingGlassIcon width={16} className="text-slate-400" />
              <input
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder="Search transactions, merchants, tags"
                className="w-[260px] bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
            <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 sm:flex">
              <CalendarDaysIcon width={14} className="text-slate-500" />
              <select value={dateRange} onChange={(event) => setDateRange(event.target.value as typeof dateRange)} className="bg-transparent text-xs font-medium text-slate-700 outline-none">
                <option value="this-month">This Month</option>
                <option value="last-30">Last 30 Days</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <Button type="button" variant="secondary" size="icon" aria-label="Notifications">
              <BellIcon width={16} />
            </Button>
            <Button type="button" variant="secondary" onClick={() => dispatch(logOut())} data-testid="logout-button">
              <ArrowLeftStartOnRectangleIcon width={16} className="mr-1.5" />
              Log Out
            </Button>
          </div>
        ) : (
          <div className="mb-3 text-slate-600">Welcome, {user?.displayName}</div>
        )}
        {children}

        <Button
          type="button"
          className="fixed bottom-5 right-4 z-40 rounded-full px-5 py-3 shadow-soft md:hidden"
          onClick={() => dispatch(setAddTransactionModalOpen(true))}
          aria-label="Add transaction quick action"
        >
          + Add
        </Button>
      </main>
    </div>
  );
};
