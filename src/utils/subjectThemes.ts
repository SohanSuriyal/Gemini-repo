import React from 'react';
import {
  Database,
  Code,
  Cpu,
  Atom,
  Calculator,
  BookOpen,
  Layers,
  GraduationCap,
  Globe,
  Palette,
  Terminal,
  FileText,
  LucideIcon,
} from 'lucide-react';

export interface SubjectTheme {
  id: string;
  accent: string;
  gradient: string;
  bgLight: string;
  bgDark: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextLight: string;
  badgeTextDark: string;
  borderLight: string;
  borderDark: string;
  hoverBorderLight: string;
  hoverBorderDark: string;
  barBg: string;
  pillBgLight: string;
  pillBgDark: string;
  pillTextLight: string;
  pillTextDark: string;
  icon: LucideIcon;
}

const THEMES: Omit<SubjectTheme, 'icon'>[] = [
  {
    id: 'purple',
    accent: '#7F56D9',
    gradient: 'from-purple-600 to-indigo-600',
    bgLight: 'bg-purple-50/60',
    bgDark: 'dark:bg-purple-950/30',
    badgeBgLight: 'bg-purple-100/80',
    badgeBgDark: 'dark:bg-purple-950/60',
    badgeTextLight: 'text-purple-700',
    badgeTextDark: 'dark:text-purple-300',
    borderLight: 'border-purple-200',
    borderDark: 'dark:border-purple-900/50',
    hoverBorderLight: 'hover:border-purple-400',
    hoverBorderDark: 'dark:hover:border-purple-500',
    barBg: 'bg-purple-600',
    pillBgLight: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    pillBgDark: 'dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800/50',
    pillTextLight: 'text-purple-700',
    pillTextDark: 'dark:text-purple-300',
  },
  {
    id: 'blue',
    accent: '#2563EB',
    gradient: 'from-blue-600 to-indigo-600',
    bgLight: 'bg-blue-50/60',
    bgDark: 'dark:bg-blue-950/30',
    badgeBgLight: 'bg-blue-100/80',
    badgeBgDark: 'dark:bg-blue-950/60',
    badgeTextLight: 'text-blue-700',
    badgeTextDark: 'dark:text-blue-300',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-900/50',
    hoverBorderLight: 'hover:border-blue-400',
    hoverBorderDark: 'dark:hover:border-blue-500',
    barBg: 'bg-blue-600',
    pillBgLight: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    pillBgDark: 'dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/50',
    pillTextLight: 'text-blue-700',
    pillTextDark: 'dark:text-blue-300',
  },
  {
    id: 'emerald',
    accent: '#059669',
    gradient: 'from-emerald-600 to-teal-600',
    bgLight: 'bg-emerald-50/60',
    bgDark: 'dark:bg-emerald-950/30',
    badgeBgLight: 'bg-emerald-100/80',
    badgeBgDark: 'dark:bg-emerald-950/60',
    badgeTextLight: 'text-emerald-700',
    badgeTextDark: 'dark:text-emerald-300',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-900/50',
    hoverBorderLight: 'hover:border-emerald-400',
    hoverBorderDark: 'dark:hover:border-emerald-500',
    barBg: 'bg-emerald-600',
    pillBgLight: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    pillBgDark: 'dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50',
    pillTextLight: 'text-emerald-700',
    pillTextDark: 'dark:text-emerald-300',
  },
  {
    id: 'amber',
    accent: '#D97706',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50/60',
    bgDark: 'dark:bg-amber-950/30',
    badgeBgLight: 'bg-amber-100/80',
    badgeBgDark: 'dark:bg-amber-950/60',
    badgeTextLight: 'text-amber-700',
    badgeTextDark: 'dark:text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-900/50',
    hoverBorderLight: 'hover:border-amber-400',
    hoverBorderDark: 'dark:hover:border-amber-500',
    barBg: 'bg-amber-500',
    pillBgLight: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    pillBgDark: 'dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/50',
    pillTextLight: 'text-amber-700',
    pillTextDark: 'dark:text-amber-300',
  },
  {
    id: 'rose',
    accent: '#E11D48',
    gradient: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50/60',
    bgDark: 'dark:bg-rose-950/30',
    badgeBgLight: 'bg-rose-100/80',
    badgeBgDark: 'dark:bg-rose-950/60',
    badgeTextLight: 'text-rose-700',
    badgeTextDark: 'dark:text-rose-300',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-900/50',
    hoverBorderLight: 'hover:border-rose-400',
    hoverBorderDark: 'dark:hover:border-rose-500',
    barBg: 'bg-rose-500',
    pillBgLight: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    pillBgDark: 'dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800/50',
    pillTextLight: 'text-rose-700',
    pillTextDark: 'dark:text-rose-300',
  },
  {
    id: 'teal',
    accent: '#0D9488',
    gradient: 'from-teal-500 to-cyan-600',
    bgLight: 'bg-teal-50/60',
    bgDark: 'dark:bg-teal-950/30',
    badgeBgLight: 'bg-teal-100/80',
    badgeBgDark: 'dark:bg-teal-950/60',
    badgeTextLight: 'text-teal-700',
    badgeTextDark: 'dark:text-teal-300',
    borderLight: 'border-teal-200',
    borderDark: 'dark:border-teal-900/50',
    hoverBorderLight: 'hover:border-teal-400',
    hoverBorderDark: 'dark:hover:border-teal-500',
    barBg: 'bg-teal-600',
    pillBgLight: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
    pillBgDark: 'dark:bg-teal-950/40 dark:hover:bg-teal-900/50 dark:text-teal-300 dark:border-teal-800/50',
    pillTextLight: 'text-teal-700',
    pillTextDark: 'dark:text-teal-300',
  },
];

/**
 * Returns a consistent, harmonious theme for any given subject name.
 */
export function getSubjectTheme(subjectName: string): SubjectTheme {
  const cleanName = (subjectName || '').toLowerCase().trim();

  // Pick an icon based on keyword matching
  let icon: LucideIcon = BookOpen;
  if (cleanName.includes('dbms') || cleanName.includes('database') || cleanName.includes('sql')) {
    icon = Database;
  } else if (
    cleanName.includes('code') ||
    cleanName.includes('program') ||
    cleanName.includes('dev') ||
    cleanName.includes('software') ||
    cleanName.includes('web')
  ) {
    icon = Code;
  } else if (
    cleanName.includes('os') ||
    cleanName.includes('operating') ||
    cleanName.includes('hardware') ||
    cleanName.includes('cpu') ||
    cleanName.includes('network')
  ) {
    icon = Cpu;
  } else if (
    cleanName.includes('physics') ||
    cleanName.includes('science') ||
    cleanName.includes('chemistry') ||
    cleanName.includes('bio')
  ) {
    icon = Atom;
  } else if (
    cleanName.includes('math') ||
    cleanName.includes('algebra') ||
    cleanName.includes('calculus') ||
    cleanName.includes('statistic')
  ) {
    icon = Calculator;
  } else if (
    cleanName.includes('terminal') ||
    cleanName.includes('linux') ||
    cleanName.includes('bash')
  ) {
    icon = Terminal;
  } else if (
    cleanName.includes('design') ||
    cleanName.includes('art') ||
    cleanName.includes('ui')
  ) {
    icon = Palette;
  } else if (
    cleanName.includes('history') ||
    cleanName.includes('geography') ||
    cleanName.includes('world')
  ) {
    icon = Globe;
  } else if (cleanName.includes('econ') || cleanName.includes('finance')) {
    icon = Layers;
  } else {
    icon = GraduationCap;
  }

  // Deterministic hash to pick one of the color themes
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % THEMES.length;
  const baseTheme = THEMES[index];

  return {
    ...baseTheme,
    icon,
  };
}
