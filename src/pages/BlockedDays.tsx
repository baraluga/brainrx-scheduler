import { useState } from 'react';
import { BlockedDayRule } from '../types/blocked';
import { listBlockedDays, addBlockedDay, removeBlockedDay } from '../services/blockedDays';

export default function BlockedDays() {
  const [blocks, setBlocks] = useState<BlockedDayRule[]>(listBlockedDays());
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    nth: '',
    weekday: '',
    excludeMonths: ''
  });

  const refresh = () => setBlocks(listBlockedDays());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined
    };
    if (form.nth && form.weekday) {
      data.recurrence = {
        frequency: 'monthly',
        nth: Number(form.nth),
        weekday: Number(form.weekday),
        excludeMonths: form.excludeMonths
          ? form.excludeMonths.split(',').map((m) => Number(m.trim()))
          : undefined
      };
    }
    addBlockedDay(data);
    setForm({ startDate: '', endDate: '', startTime: '', endTime: '', nth: '', weekday: '', excludeMonths: '' });
    refresh();
  };

  const handleRemove = (id: string) => {
    removeBlockedDay(id);
    refresh();
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Blocked Days</h1>
      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <div>
          <label className="block text-sm">Start Date</label>
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="border p-1 rounded w-full" required />
        </div>
        <div>
          <label className="block text-sm">End Date</label>
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="border p-1 rounded w-full" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm">Start Time</label>
            <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="border p-1 rounded w-full" />
          </div>
          <div className="flex-1">
            <label className="block text-sm">End Time</label>
            <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="border p-1 rounded w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm">Nth</label>
            <input type="number" name="nth" value={form.nth} onChange={handleChange} className="border p-1 rounded w-full" />
          </div>
          <div className="flex-1">
            <label className="block text-sm">Weekday (0-6)</label>
            <input type="number" name="weekday" value={form.weekday} onChange={handleChange} className="border p-1 rounded w-full" />
          </div>
        </div>
        <div>
          <label className="block text-sm">Exclude Months (comma-separated)</label>
          <input type="text" name="excludeMonths" value={form.excludeMonths} onChange={handleChange} className="border p-1 rounded w-full" />
        </div>
        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Add</button>
      </form>
      <ul className="space-y-2">
        {blocks.map((b) => (
          <li key={b.id} className="border p-2 flex justify-between items-center">
            <span>
              {b.startDate}
              {b.endDate ? ` - ${b.endDate}` : ''}
              {b.startTime ? ` ${b.startTime}-${b.endTime}` : ''}
              {b.recurrence ? ` (nth ${b.recurrence.nth} weekday ${b.recurrence.weekday})` : ''}
            </span>
            <button onClick={() => handleRemove(b.id)} className="text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
