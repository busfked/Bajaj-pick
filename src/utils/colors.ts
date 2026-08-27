import { ColorTheme } from '../types';

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  amharicName: string;
  previewHex: string;
  primaryBg: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  textPrimary: string;
  borderPrimary: string;
  ringPrimary: string;
  badgeBg: string;
  badgeText: string;
}

export const COLOR_THEMES: Record<ColorTheme, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Ethiopian Emerald',
    amharicName: 'አረንጓዴ (Emerald)',
    previewHex: '#10B981',
    primaryBg: 'bg-emerald-500',
    primaryHover: 'hover:bg-emerald-600',
    primaryLight: 'bg-emerald-50 dark:bg-emerald-950/60',
    primaryDark: 'bg-emerald-900',
    textPrimary: 'text-emerald-600 dark:text-emerald-400',
    borderPrimary: 'border-emerald-500/30',
    ringPrimary: 'focus:ring-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
  },
  amber: {
    id: 'amber',
    name: 'Bajaj Taxi Yellow',
    amharicName: 'ባጃጅ ቢጫ (Taxi Gold)',
    previewHex: '#F59E0B',
    primaryBg: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    primaryLight: 'bg-amber-50 dark:bg-amber-950/60',
    primaryDark: 'bg-amber-900',
    textPrimary: 'text-amber-600 dark:text-amber-400',
    borderPrimary: 'border-amber-500/30',
    ringPrimary: 'focus:ring-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
  },
  blue: {
    id: 'blue',
    name: 'Electric Blue',
    amharicName: 'ሰማያዊ (Electric Blue)',
    previewHex: '#3B82F6',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryLight: 'bg-blue-50 dark:bg-blue-950/60',
    primaryDark: 'bg-blue-900',
    textPrimary: 'text-blue-600 dark:text-blue-400',
    borderPrimary: 'border-blue-500/30',
    ringPrimary: 'focus:ring-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-800 dark:text-blue-300',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    amharicName: 'ወይን ጠጅ (Purple)',
    previewHex: '#8B5CF6',
    primaryBg: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-50 dark:bg-purple-950/60',
    primaryDark: 'bg-purple-900',
    textPrimary: 'text-purple-600 dark:text-purple-400',
    borderPrimary: 'border-purple-500/30',
    ringPrimary: 'focus:ring-purple-500',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
  },
  rose: {
    id: 'rose',
    name: 'Sunset Rose',
    amharicName: 'ቀይ ጽጌሬዳ (Rose)',
    previewHex: '#F43F5E',
    primaryBg: 'bg-rose-500',
    primaryHover: 'hover:bg-rose-600',
    primaryLight: 'bg-rose-50 dark:bg-rose-950/60',
    primaryDark: 'bg-rose-900',
    textPrimary: 'text-rose-600 dark:text-rose-400',
    borderPrimary: 'border-rose-500/30',
    ringPrimary: 'focus:ring-rose-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
    badgeText: 'text-rose-800 dark:text-rose-300',
  },
  slate: {
    id: 'slate',
    name: 'Modern Slate',
    amharicName: 'ጨለማ ግራጫ (Onyx Slate)',
    previewHex: '#475569',
    primaryBg: 'bg-slate-700 dark:bg-slate-600',
    primaryHover: 'hover:bg-slate-800 dark:hover:bg-slate-500',
    primaryLight: 'bg-slate-100 dark:bg-slate-800/80',
    primaryDark: 'bg-slate-900',
    textPrimary: 'text-slate-700 dark:text-slate-300',
    borderPrimary: 'border-slate-500/30',
    ringPrimary: 'focus:ring-slate-500',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
  },
};
