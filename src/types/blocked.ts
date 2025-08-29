export interface BlockedDayRule {
  id: string;
  startDate: string; // ISO date, inclusive
  endDate?: string; // ISO date, inclusive
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  recurrence?: {
    frequency: 'monthly';
    nth: number; // e.g., 1 for 1st
    weekday: number; // 0=Sun ... 6=Sat
    excludeMonths?: number[]; // 1-12
  };
}

export interface EffectiveBlock {
  start: Date;
  end: Date;
}
