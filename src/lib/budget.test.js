import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIncomeSummary } from './budget.ts';

test('calculates remaining amount from income minus expenses and default spends', () => {
  const summary = calculateIncomeSummary({
    income: 50000,
    spent: 12000,
    recurring: 5000,
  });

  assert.equal(summary.totalIncome, 50000);
  assert.equal(summary.totalSpent, 12000);
  assert.equal(summary.defaultSpends, 5000);
  assert.equal(summary.remaining, 33000);
});

test('handles zero income safely', () => {
  const summary = calculateIncomeSummary({
    income: 0,
    spent: 2000,
    recurring: 1000,
  });

  assert.equal(summary.remaining, -3000);
  assert.equal(summary.spentPercent, 0);
});
