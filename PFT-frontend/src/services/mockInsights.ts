export interface InsightResponse {
  headline: string;
  message: string;
}

const insights: InsightResponse[] = [
  { headline: "Healthy Spending Mix", message: "Your essential spending remains below 62% this period." },
  { headline: "Momentum Building", message: "Income inflow is trending above your last 30-day average." },
  { headline: "Goal Opportunity", message: "You can route a small surplus to goals this week." }
];

export const fetchPremiumInsight = async (): Promise<InsightResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return insights[new Date().getDate() % insights.length];
};