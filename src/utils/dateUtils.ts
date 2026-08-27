import { Student, PackageIntervalKey, PACKAGE_INTERVALS } from '../types';

/**
 * Checks if a given ISO due date string (YYYY-MM-DD) falls within a target month name (e.g. "July")
 */
export function isDueDateInMonth(dueDateStr: string | null | undefined, targetMonth: string): boolean {
  if (!dueDateStr) return false;
  try {
    const cleanStr = dueDateStr.trim();
    if (!cleanStr) return false;
    const d = new Date(cleanStr.includes('T') ? cleanStr : `${cleanStr}T00:00:00`);
    if (isNaN(d.getTime())) return false;
    const month = d.toLocaleString('en-US', { month: 'long' });
    return month.toLowerCase() === targetMonth.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Returns formatted date e.g. "15 Jul 2026" or "15 Jul"
 */
export function formatDueDate(dueDateStr: string | null | undefined, includeYear: boolean = true): string {
  if (!dueDateStr) return '';
  try {
    const cleanStr = dueDateStr.trim();
    if (!cleanStr) return '';
    const d = new Date(cleanStr.includes('T') ? cleanStr : `${cleanStr}T00:00:00`);
    if (isNaN(d.getTime())) return dueDateStr;
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      ...(includeYear ? { year: 'numeric' } : {}),
    });
  } catch {
    return dueDateStr;
  }
}

/**
 * Extract full month name from a due date (e.g. "July")
 */
export function getDueDateMonthName(dueDateStr: string | null | undefined): string | null {
  if (!dueDateStr) return null;
  try {
    const cleanStr = dueDateStr.trim();
    if (!cleanStr) return null;
    const d = new Date(cleanStr.includes('T') ? cleanStr : `${cleanStr}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-US', { month: 'long' });
  } catch {
    return null;
  }
}

export interface PackagedDueInfo {
  intervalsDueThisMonth: {
    key: PackageIntervalKey;
    name: string;
    shortName: string;
    dueDate: string;
    formattedDueDate: string;
    isPaid: boolean;
  }[];
  allIntervals: {
    key: PackageIntervalKey;
    name: string;
    shortName: string;
    dueDate: string | null;
    formattedDueDate: string | null;
    isPaid: boolean;
    isDueThisMonth: boolean;
  }[];
  hasDueThisMonth: boolean;
  hasUnpaidDueThisMonth: boolean;
}

export function getStudentPackagedDueInfo(student: Student, activeMonth: string): PackagedDueInfo {
  const records = student.packageRecords || {};
  const intervalsDueThisMonth: PackagedDueInfo['intervalsDueThisMonth'] = [];
  
  const allIntervals = PACKAGE_INTERVALS.map((meta) => {
    const rec = records[meta.key];
    const isPaid = rec?.feeStatus === 'PAID';
    const dueDate = rec?.dueDate || null;
    const isDueThisMonth = isDueDateInMonth(dueDate, activeMonth);
    const formattedDueDate = dueDate ? formatDueDate(dueDate, false) : null;

    if (dueDate && isDueThisMonth) {
      intervalsDueThisMonth.push({
        key: meta.key,
        name: meta.name,
        shortName: meta.shortName,
        dueDate,
        formattedDueDate: formatDueDate(dueDate, true),
        isPaid,
      });
    }

    return {
      key: meta.key,
      name: meta.name,
      shortName: meta.shortName,
      dueDate,
      formattedDueDate,
      isPaid,
      isDueThisMonth,
    };
  });

  const hasDueThisMonth = intervalsDueThisMonth.length > 0;
  const hasUnpaidDueThisMonth = intervalsDueThisMonth.some((i) => !i.isPaid);

  return {
    intervalsDueThisMonth,
    allIntervals,
    hasDueThisMonth,
    hasUnpaidDueThisMonth,
  };
}
