export interface IncomeSummaryInput {
  income: number;
  spent: number;
  recurring?: number;
}

export interface IncomeSummary {
  totalIncome: number;
  totalSpent: number;
  defaultSpends: number;
  remaining: number;
  spentPercent: number;
}

export function calculateIncomeSummary({
  income,
  spent,
  recurring = 0,
}: IncomeSummaryInput): IncomeSummary {
  const totalIncome = Number(income) || 0;
  const totalSpent = Number(spent) || 0;
  const defaultSpends = Number(recurring) || 0;
  const remaining = totalIncome - totalSpent - defaultSpends;
  const spentPercent = totalIncome > 0 ? Math.min(((totalSpent + defaultSpends) / totalIncome) * 100, 100) : 0;

  return {
    totalIncome,
    totalSpent,
    defaultSpends,
    remaining,
    spentPercent,
  };
}
