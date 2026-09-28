/*
# Add budget, recurring expenses, and custom categories tables

## Overview
This migration adds three new tables to support budget tracking, recurring monthly expenses,
and user-defined custom categories for the expense tracker app.

## New Tables

### budget_settings
- Stores the user's monthly budget amount (total money they have for the month)
- `id` (uuid, primary key)
- `monthly_budget` (numeric(12,2) — the total budget amount)
- `updated_at` (timestamptz — when last updated)

### recurring_expenses
- Stores default/recurring monthly expenses like EB bills, car EMI, rent, etc.
- `id` (uuid, primary key)
- `name` (text — name of the recurring expense, e.g. "Electricity Bill")
- `amount` (numeric(12,2) — the amount)
- `category` (text — which category it belongs to)
- `due_day` (int — day of the month it's due, 1-31)
- `active` (boolean — whether it's currently active)
- `created_at` (timestamptz)

### custom_categories
- Stores user-created custom categories beyond the built-in ones
- `id` (uuid, primary key)
- `name` (text — the category name)
- `color` (text — hex color for the category)
- `created_at` (timestamptz)

## Security
- RLS enabled on all three tables
- All CRUD policies scoped to `anon, authenticated` (single-tenant, no auth)

## Important Notes
1. All tables are single-tenant (no auth) — anon access required
2. budget_settings has only one row (singleton pattern)
3. recurring_expenses allows the user to define default monthly spends
4. custom_categories lets users create their own categories when built-in ones aren't enough
*/

CREATE TABLE IF NOT EXISTS budget_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_budget numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_budget" ON budget_settings;
CREATE POLICY "anon_select_budget" ON budget_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budget" ON budget_settings;
CREATE POLICY "anon_insert_budget" ON budget_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budget" ON budget_settings;
CREATE POLICY "anon_update_budget" ON budget_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budget" ON budget_settings;
CREATE POLICY "anon_delete_budget" ON budget_settings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  due_day int NOT NULL DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 31),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_recurring" ON recurring_expenses;
CREATE POLICY "anon_select_recurring" ON recurring_expenses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_recurring" ON recurring_expenses;
CREATE POLICY "anon_insert_recurring" ON recurring_expenses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_recurring" ON recurring_expenses;
CREATE POLICY "anon_update_recurring" ON recurring_expenses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_recurring" ON recurring_expenses;
CREATE POLICY "anon_delete_recurring" ON recurring_expenses FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748B',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_custom_cat" ON custom_categories;
CREATE POLICY "anon_select_custom_cat" ON custom_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_custom_cat" ON custom_categories;
CREATE POLICY "anon_insert_custom_cat" ON custom_categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_custom_cat" ON custom_categories;
CREATE POLICY "anon_update_custom_cat" ON custom_categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_custom_cat" ON custom_categories;
CREATE POLICY "anon_delete_custom_cat" ON custom_categories FOR DELETE
  TO anon, authenticated USING (true);