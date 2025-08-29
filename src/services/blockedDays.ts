import { BlockedDayRule, EffectiveBlock } from '../types/blocked';
import { STORAGE_KEYS } from '../utils/storage';
import * as crud from '../utils/crud';
import { cancelSessionsOverlapping } from './sessions';

/** Return all stored block rules */
export function listBlockedDays(): BlockedDayRule[] {
  return crud.getAll<BlockedDayRule>(STORAGE_KEYS.blockedDays);
}

/** Add a new block rule and cancel any existing overlapping sessions */
export function addBlockedDay(data: Omit<BlockedDayRule, 'id'>): BlockedDayRule {
  const created = crud.create<BlockedDayRule>(STORAGE_KEYS.blockedDays, data as any);
  const from = new Date(created.startDate);
  const to = created.endDate ? new Date(created.endDate) : new Date(from.getFullYear() + 1, from.getMonth(), from.getDate());
  expandRule(created, { from, to }).forEach(cancelSessionsOverlapping);
  return created;
}

/** Remove a block rule */
export function removeBlockedDay(id: string): void {
  crud.remove(STORAGE_KEYS.blockedDays, id);
}

/** List effective blocks for a given range */
export function listEffectiveBlocks(range: { from: Date; to: Date }): EffectiveBlock[] {
  return listBlockedDays().flatMap((rule) => expandRule(rule, range));
}

// Helpers
function combine(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function expandRule(rule: BlockedDayRule, range: { from: Date; to: Date }): EffectiveBlock[] {
  const blocks: EffectiveBlock[] = [];
  if (rule.recurrence) {
    const cursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
    const end = new Date(range.to.getFullYear(), range.to.getMonth(), 1);
    while (cursor <= end) {
      const month = cursor.getMonth() + 1;
      if (!rule.recurrence.excludeMonths || !rule.recurrence.excludeMonths.includes(month)) {
        const date = nthWeekdayOfMonth(cursor.getFullYear(), cursor.getMonth(), rule.recurrence.weekday, rule.recurrence.nth);
        if (date && date >= range.from && date <= range.to) {
          const start = combine(date, rule.startTime || '00:00');
          const endTime = rule.endTime || '23:59';
          const endDate = combine(date, endTime);
          blocks.push({ start, end: endDate });
        }
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return blocks;
  }
  const start = new Date(rule.startDate);
  const final = rule.endDate ? new Date(rule.endDate) : start;
  for (let d = new Date(start); d <= final; d.setDate(d.getDate() + 1)) {
    if (d < range.from || d > range.to) continue;
    const startDt = combine(d, rule.startTime || '00:00');
    const endDt = combine(d, rule.endTime || '23:59');
    blocks.push({ start: new Date(startDt), end: new Date(endDt) });
  }
  return blocks;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const first = new Date(year, month, 1);
  const diff = (weekday - first.getDay() + 7) % 7;
  const day = 1 + diff + (nth - 1) * 7;
  const date = new Date(year, month, day);
  if (date.getMonth() !== month) return null;
  return date;
}
