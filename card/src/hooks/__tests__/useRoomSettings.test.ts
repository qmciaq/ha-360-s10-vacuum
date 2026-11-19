import { describe, expect, it, beforeEach } from 'vitest';
import { readStoredConfigs, writeStoredConfigs } from '../useRoomSettings';

describe('useRoomSettings storage', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  it('reads empty configs by default', () => {
    expect(readStoredConfigs('vacuum.test')).toEqual({});
  });

  it('writes and reads room configs correctly', () => {
    const configs = {
      1: { suctionLevel: 'quiet', wetnessLevel: 1, cleaningTimes: '2' },
      2: { suctionLevel: 'max', wetnessLevel: 3, cleaningTimes: '1' },
    };
    writeStoredConfigs('vacuum.test', configs);
    expect(readStoredConfigs('vacuum.test')).toEqual(configs);
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('botslab_room_settings_vacuum.test', 'invalid json');
    expect(readStoredConfigs('vacuum.test')).toEqual({});
  });
});
