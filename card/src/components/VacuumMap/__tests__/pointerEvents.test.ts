import { describe, expect, it } from 'vitest';
import { compile } from 'sass';

/**
 * Map overlay layering is invisible in unit tests, but it decides whether a tap
 * on a room ever reaches the room segment. `.vacuum-map__picture-frame` is a
 * transparent layout wrapper rendered after (above) the room segments, so it must
 * stay transparent to pointer events; otherwise tapping a room on the map does
 * nothing while the room list keeps working.
 */
const css = compile('src/components/VacuumMap/VacuumMap.scss', { style: 'expanded' }).css;

function declarations(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  if (!match) {
    throw new Error(`selector not found in compiled CSS: ${selector}`);
  }
  return match[1];
}

describe('VacuumMap overlay pointer events', () => {
  it('keeps the picture-frame wrapper transparent to taps', () => {
    expect(declarations('.vacuum-map__picture-frame')).toContain('pointer-events: none');
  });

  it('lets taps reach room segments through the room-segments SVG', () => {
    expect(declarations('.vacuum-map__room-segments')).toContain('pointer-events: none');
  });

  it('keeps saved no-go areas transparent except for their delete button', () => {
    expect(declarations('.vacuum-map__saved-zone')).toContain('pointer-events: none');
    expect(declarations('.vacuum-map__saved-zone-delete')).toContain('pointer-events: auto');
  });

  it('still lets the zone overlay capture taps for zone creation', () => {
    expect(declarations('.vacuum-map__zone-container')).toContain('pointer-events: auto');
  });
});