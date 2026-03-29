import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkTo: string;
}

export const AuthShell = ({ title, subtitle, children, footerText, footerLinkLabel, footerLinkTo }: AuthShellProps) => (
  <main className="grid min-h-screen place-items-center p-5">
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md rounded-[24px] bg-white p-7 shadow-soft ring-1 ring-slate-200/80"
    >
      <div className="mb-5">
        <p className="text-sm font-medium text-indigo-600">Personal Finance Tracker</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
      <p className="mt-5 text-sm text-slate-500">
        {footerText} <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to={footerLinkTo}>{footerLinkLabel}</Link>
      </p>
    </motion.section>
  </main>
);