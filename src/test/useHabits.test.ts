import { describe, it, expect } from 'vitest';
import { convertToAppFormat, mapHabitRow } from '@/hooks/useHabits';

describe('convertToAppFormat', () => {
  const baseRow = {
    id: 'entry-1',
    habit_id: 'habit-1',
    date: '2024-01-15',
    completed: true,
    completed_at: '2024-01-15T10:30:00.000Z',
    notes: 'Felt great',
  };

  it('maps snake_case DB fields to camelCase app fields', () => {
    const result = convertToAppFormat(baseRow);
    expect(result.id).toBe('entry-1');
    expect(result.habitId).toBe('habit-1');
    expect(result.date).toBe('2024-01-15');
    expect(result.completed).toBe(true);
    expect(result.completedAt).toBe('2024-01-15T10:30:00.000Z');
    expect(result.notes).toBe('Felt great');
  });

  it('converts null completed_at to undefined', () => {
    const result = convertToAppFormat({ ...baseRow, completed_at: null });
    expect(result.completedAt).toBeUndefined();
  });

  it('converts null notes to undefined', () => {
    const result = convertToAppFormat({ ...baseRow, notes: null });
    expect(result.notes).toBeUndefined();
  });

  it('preserves completed = false', () => {
    const result = convertToAppFormat({ ...baseRow, completed: false });
    expect(result.completed).toBe(false);
  });
});

describe('mapHabitRow', () => {
  const baseRow = {
    id: 'habit-1',
    name: 'Meditate',
    icon: '🧘',
    description: 'Daily meditation',
    order_index: 2,
    is_active: true,
    value_type: 'boolean',
    color: '#ff5500',
  };

  it('maps order_index to orderIndex', () => {
    expect(mapHabitRow(baseRow).orderIndex).toBe(2);
  });

  it('maps is_active to isActive', () => {
    expect(mapHabitRow(baseRow).isActive).toBe(true);
    expect(mapHabitRow({ ...baseRow, is_active: false }).isActive).toBe(false);
  });

  it('maps value_type "tiered" correctly', () => {
    expect(mapHabitRow({ ...baseRow, value_type: 'tiered' }).valueType).toBe('tiered');
  });

  it('defaults non-tiered value_type to "boolean"', () => {
    expect(mapHabitRow({ ...baseRow, value_type: 'boolean' }).valueType).toBe('boolean');
    expect(mapHabitRow({ ...baseRow, value_type: 'other' }).valueType).toBe('boolean');
    expect(mapHabitRow({ ...baseRow, value_type: null }).valueType).toBe('boolean');
  });

  it('converts null color to undefined', () => {
    expect(mapHabitRow({ ...baseRow, color: null }).color).toBeUndefined();
  });

  it('converts null description to undefined', () => {
    expect(mapHabitRow({ ...baseRow, description: null }).description).toBeUndefined();
  });

  it('maps all core fields correctly', () => {
    const result = mapHabitRow(baseRow);
    expect(result.id).toBe('habit-1');
    expect(result.name).toBe('Meditate');
    expect(result.icon).toBe('🧘');
    expect(result.color).toBe('#ff5500');
  });
});
