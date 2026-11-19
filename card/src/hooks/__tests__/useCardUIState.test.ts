import { describe, expect, it } from 'vitest';
import { parseAreaSelectionMode } from '../useCardUIState';

describe('parseAreaSelectionMode', () => {
  it('restores the restricted-area modes', () => {
    expect(parseAreaSelectionMode('no_go')).toBe('no_go');
    expect(parseAreaSelectionMode('no_mop')).toBe('no_mop');
  });

  it.each([null, '', 'zone', 'spot', 'invalid'])('falls back to zone for %s', (value) => {
    expect(parseAreaSelectionMode(value)).toBe('zone');
  });
});