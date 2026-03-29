import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const EmptyState = ({ title, description, ctaLabel, onCtaClick }: EmptyStateProps) => (
  <Card className="text-center">
    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-indigo-100" />
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">{description}</p>
    {ctaLabel && onCtaClick ? (
      <button className="btn primary mt-4" type="button" onClick={onCtaClick}>
        {ctaLabel}
      </button>
    ) : null}
  </Card>
);