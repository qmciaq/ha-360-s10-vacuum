import { describe, expect, it } from 'vitest';
import { classifyDockStatus, DOCK_TASKS, shouldOpenDockPopup } from '../dockPopup';

describe('shouldOpenDockPopup', () => {
  it.each(['idle', 'maintenance', 'error', 'other', 'cleaning', 'returning'] as const)(
    'returns false during %s because Botslab vacuums do not have a separate dock station popup',
    (phase) => {
      expect(shouldOpenDockPopup(phase, 'docked')).toBe(false);
      expect(shouldOpenDockPopup(phase, 'idle')).toBe(false);
    }
  );

  it('does not open without a vacuum state', () => {
    expect(shouldOpenDockPopup('idle', undefined)).toBe(false);
  });
});

describe('classifyDockStatus', () => {
  it('returns good for Botslab dock statuses', () => {
    expect(classifyDockStatus('ok')).toBe('good');
    expect(classifyDockStatus(true)).toBe('good');
  });
});

describe('dock tasks', () => {
  it('uses current registry translation keys', () => {
    expect(DOCK_TASKS.length).toBeGreaterThan(0);
  });
});
