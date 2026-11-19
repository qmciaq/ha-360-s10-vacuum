import type { VacuumPhase } from '@/constants';

export type DockStatusLevel = 'good' | 'warning' | 'bad' | 'unknown';

export const DOCK_TASKS = [
  { key: 'start_auto_empty', labelKey: 'settings.station_controls.start_auto_empty' },
  { key: 'self_clean', labelKey: 'settings.station_controls.self_clean' },
  { key: 'manual_drying', labelKey: 'settings.station_controls.manual_drying' },
] as const;

export function shouldOpenDockPopup(_phase: VacuumPhase, _vacuumState: string | undefined): boolean {
  return false;
}

export function classifyDockStatus(_value: unknown, _warnWhenLow = false): DockStatusLevel {
  return 'good';
}
