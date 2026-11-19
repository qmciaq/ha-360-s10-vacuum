import type { HassEntity, CleaningSelectionMode, Hass } from '@/types/homeassistant';
import { getAttr } from './typeGuards';
import { parseRooms } from './roomParser';

export function resolveMapEntityId(
  configuredMapEntity?: string,
  discoveredMapEntity?: string,
  hass?: Hass,
  vacuumEntityId?: string
): string {
  if (configuredMapEntity) return configuredMapEntity;
  if (discoveredMapEntity) return discoveredMapEntity;
  if (!hass || !vacuumEntityId) return '';

  const vacPrefix = vacuumEntityId.replace(/^vacuum\./, '');
  const candidate = Object.keys(hass.states).find(
    (id) => id.startsWith('camera.') && (id.includes(vacPrefix) || id.includes('cleaning_map') || id.includes('map'))
  );
  return candidate || '';
}

export function getEffectiveCleaningMode(
  entity: HassEntity,
  selectedMode: CleaningSelectionMode
): CleaningSelectionMode {
  const vacuumStatus = getAttr(entity.attributes.status, '');
  const isSegmentCleaning = entity.attributes.segment_cleaning || false;
  const isZoneCleaning = entity.attributes.zone_cleaning || false;

  if (entity.attributes.started) {
    if (isSegmentCleaning || vacuumStatus.toLowerCase().includes('room')) {
      return 'room';
    }
    if (isZoneCleaning || vacuumStatus.toLowerCase().includes('zone')) {
      return 'zone';
    }
  }

  return selectedMode;
}

/**
 * Get active segments from vacuum entity when segment cleaning is in progress.
 * Returns a Map of roomId -> roomName for the currently cleaning segments.
 */
export function getActiveSegments(
  hass: Hass,
  vacuumEntityId: string,
  cameraEntityId: string,
  roomNames?: Record<string, string>
): Map<number, string> {
  const vacuumEntity = hass.states[vacuumEntityId];
  const cameraEntity = hass.states[cameraEntityId];
  const result = new Map<number, string>();

  if (!vacuumEntity) return result;

  const isSegmentCleaning = vacuumEntity.attributes.segment_cleaning === true;
  const activeSegments = vacuumEntity.attributes.active_segments as number[] | null;

  if (!isSegmentCleaning || !activeSegments || !Array.isArray(activeSegments)) {
    return result;
  }

  // Get room names from camera entity
  const roomNameById = new Map<number, string>();
  if (cameraEntity?.attributes?.rooms) {
    const parsed = parseRooms(cameraEntity.attributes.rooms, roomNames);
    for (const r of parsed) {
      roomNameById.set(r.id, r.name);
    }
  }

  // Map active segment IDs to their names
  activeSegments.forEach((segmentId) => {
    const name = roomNameById.get(segmentId) || `Room ${segmentId}`;
    result.set(segmentId, name);
  });

  return result;
}
