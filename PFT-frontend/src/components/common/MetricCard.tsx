import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  hint?: string;
  tone?: "indigo" | "green" | "red" | "amber";
  index?: number;
}

const toneClass: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  indigo: "from-indigo-500/15",
  green: "from-emerald-500/15",
  red: "from-rose-500/15",
  amber: "from-amber-500/15"
};

export const MetricCard = ({ title, value, hint, tone = "indigo", index = 0 }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    <Card className={`bg-gradient-to-br ${toneClass[tone]} to-white`}>
      <div className="card-title">{title}</div>
      <div className="metric">{value}</div>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  </motion.div>
);