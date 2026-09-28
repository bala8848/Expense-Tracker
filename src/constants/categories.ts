import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Home,
  Heart,
  Film,
  GraduationCap,
  Plane,
  Smartphone,
  Gift,
  Wallet,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryDef {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  isCustom?: boolean;
}

export const BUILT_IN_CATEGORIES: CategoryDef[] = [
  { label: 'Food & Dining', value: 'Food', icon: UtensilsCrossed, color: '#F59E0B' },
  { label: 'Transport', value: 'Transport', icon: Car, color: '#3B82F6' },
  { label: 'Shopping', value: 'Shopping', icon: ShoppingBag, color: '#EC4899' },
  { label: 'Bills & Utilities', value: 'Bills', icon: Home, color: '#8B5CF6' },
  { label: 'Health', value: 'Health', icon: Heart, color: '#EF4444' },
  { label: 'Entertainment', value: 'Entertainment', icon: Film, color: '#06B6D4' },
  { label: 'Education', value: 'Education', icon: GraduationCap, color: '#10B981' },
  { label: 'Travel', value: 'Travel', icon: Plane, color: '#F97316' },
  { label: 'Electronics', value: 'Electronics', icon: Smartphone, color: '#6366F1' },
  { label: 'Gifts', value: 'Gifts', icon: Gift, color: '#D946EF' },
  { label: 'Other', value: 'Other', icon: MoreHorizontal, color: '#64748B' },
];

export const EXPENSE_CATEGORIES = BUILT_IN_CATEGORIES.filter((c) => c.value !== 'Income');

export function isExpenseCategory(value: string): boolean {
  return String(value).trim().toLowerCase() !== 'income';
}

export const CUSTOM_COLORS = [
  '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444',
  '#06B6D4', '#10B981', '#F97316', '#6366F1', '#D946EF',
  '#22C55E', '#64748B', '#0F766E', '#E11D48', '#7C3AED',
];

export function getCustomCategoryDef(name: string, color: string): CategoryDef {
  return {
    label: name,
    value: name,
    icon: MoreHorizontal,
    color,
    isCustom: true,
  };
}

export function getCategoryDef(value: string, customCats: { name: string; color: string }[] = []): CategoryDef {
  const builtIn = BUILT_IN_CATEGORIES.find((c) => c.value === value);
  if (builtIn) return builtIn;

  const custom = customCats.find((c) => c.name === value);
  if (custom) return getCustomCategoryDef(custom.name, custom.color);

  return BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1];
}
