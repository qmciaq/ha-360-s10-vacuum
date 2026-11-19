import { useCallback } from 'react';
import type { Hass, CleaningSelectionMode, RoomsConfig, Zone, StopAction } from '@/types/homeassistant';
import type { MapTransform } from '@/utils/mapTransform';
import { useTranslation } from './useTranslation';
import { buildCleanZonePayload, convertUIZoneToVacuumZone } from '@/utils/zoneConverter';
import { logger } from '@/utils/logger';

interface VacuumServicesParams {
  hass: Hass;
  entityId: string;
  mapEntityId: string;
  mapTransform: MapTransform | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Safely call a Home Assistant service with error handling
 */
async function safeCallService(
  hass: Hass,
  domain: string,
  service: string,
  data: Record<string, unknown>,
  onError?: (message: string) => void,
  errorMessage?: string
): Promise<boolean> {
  try {
    await hass.callService(domain, service, data);
    return true;
  } catch (error) {
    logger.error(`Service call failed: ${domain}.${service}`, error);
    if (onError && errorMessage) {
      onError(errorMessage);
    }
    return false;
  }
}

/**
 * Hook providing vacuum service operations for Botslab vacuums
 */
export function useVacuumServices({
  hass,
  entityId,
  mapEntityId,
  mapTransform,
  onSuccess,
  onError,
}: VacuumServicesParams) {
  const { t } = useTranslation();

  const handleStart = useCallback(async () => {
    logger.debug('Vacuum', 'Start full clean', entityId);
    const success = await safeCallService(
      hass,
      'vacuum',
      'start',
      { entity_id: entityId },
      onError,
      t('errors.service_call_failed')
    );
    if (success) {
      onSuccess?.(t('toast.starting_full_clean'));
    }
  }, [hass, entityId, onSuccess, onError, t]);

  const handleResume = useCallback(async () => {
    logger.debug('Vacuum', 'Resume', entityId);
    const success = await safeCallService(
      hass,
      'vacuum',
      'start',
      { entity_id: entityId },
      onError,
      t('errors.service_call_failed')
    );
    if (success) {
      onSuccess?.(t('toast.resuming'));
    }
  }, [hass, entityId, onSuccess, onError, t]);

  const handlePause = useCallback(async () => {
    logger.debug('Vacuum', 'Pause', entityId);
    const success = await safeCallService(
      hass,
      'vacuum',
      'pause',
      { entity_id: entityId },
      onError,
      t('errors.service_call_failed')
    );
    if (success) {
      onSuccess?.(t('toast.pausing_vacuum'));
    }
  }, [hass, entityId, onSuccess, onError, t]);

  const handleStop = useCallback(
    async (_action: StopAction = 'stop_and_dock') => {
      logger.debug('Vacuum', 'Stop & Return to dock', { entityId });
      const success = await safeCallService(
        hass,
        'vacuum',
        'return_to_base',
        { entity_id: entityId },
        onError,
        t('errors.service_call_failed')
      );
      if (success) {
        onSuccess?.(t('toast.stopping_and_docking'));
      }
    },
    [hass, entityId, onSuccess, onError, t]
  );

  const handleDock = useCallback(async () => {
    logger.debug('Vacuum', 'Return to dock', entityId);
    const success = await safeCallService(
      hass,
      'vacuum',
      'return_to_base',
      { entity_id: entityId },
      onError,
      t('errors.service_call_failed')
    );
    if (success) {
      onSuccess?.(t('toast.vacuum_docking'));
    }
  }, [hass, entityId, onSuccess, onError, t]);

  const handleCleanSegments = useCallback(
    async (
      segments: number[],
      count: number,
      repeats: number = 1,
      roomsConfig?: RoomsConfig
    ) => {
      logger.debug('Vacuum', 'Clean segments', { entityId, segments, count, repeats, roomsConfig });
      const serviceData: Record<string, unknown> = {
        entity_id: entityId,
        room_ids: segments,
        repeat_times: repeats,
      };
      if (roomsConfig && Object.keys(roomsConfig).length > 0) {
        serviceData.rooms_config = roomsConfig;
      }
      const success = await safeCallService(
        hass,
        'botslab_vacuum',
        'clean_rooms',
        serviceData,
        onError,
        t('errors.service_call_failed')
      );
      if (success) {
        const key = count === 1 ? 'toast.starting_room_clean' : 'toast.starting_room_clean_plural';
        onSuccess?.(t(key, { count: String(count) }));
      }
    },
    [hass, entityId, onSuccess, onError, t]
  );

  const handleCleanZone = useCallback(
    async (zones: Zone[], imageWidth: number, imageHeight: number, repeats: number = 1) => {
      logger.debug('Vacuum', 'Clean zones - input:', {
        uiZones: zones,
        imageWidth,
        imageHeight,
        mapEntityId,
        repeats,
        transformSource: mapTransform?.source,
      });

      const conversion = buildCleanZonePayload(zones, mapTransform, imageWidth, imageHeight);
      if (!conversion.ok) {
        logger.warn('Vacuum', 'Zone conversion blocked', {
          reason: conversion.reason,
          mapEntityId,
          transformSource: mapTransform?.source,
        });
        onError?.(t('errors.map_transform_unavailable'));
        return;
      }

      logger.debug('Vacuum', 'Clean zones - converted:', conversion.zones);

      const success = await safeCallService(
        hass,
        'botslab_vacuum',
        'clean_zone',
        {
          entity_id: entityId,
          zones: conversion.zones,
          repeat_times: repeats,
        },
        onError,
        t('errors.service_call_failed')
      );
      if (success) {
        onSuccess?.(t('toast.starting_zone_clean'));
      }
    },
    [hass, entityId, mapEntityId, mapTransform, onSuccess, onError, t]
  );

  const handleSaveNoGoZone = useCallback(
    async (zones: Zone[], imageWidth: number, imageHeight: number, zoneType: 'forbid' | 'mop'): Promise<boolean> => {
      if (zones.length === 0) {
        onError?.(t('toast.select_zone_first'));
        return false;
      }

      for (const z of zones) {
        const result = convertUIZoneToVacuumZone(z, mapTransform, imageWidth, imageHeight);
        if (!result.ok) {
          onError?.(t('errors.map_transform_unavailable'));
          return false;
        }

        const success = await safeCallService(
          hass,
          'botslab_vacuum',
          'add_no_go_zone',
          {
            entity_id: entityId,
            zone_type: zoneType,
            x1: result.zone.x1,
            y1: result.zone.y1,
            x2: result.zone.x2,
            y2: result.zone.y2,
          },
          onError,
          t('errors.service_call_failed')
        );

        if (!success) return false;
      }

      // Only report success once the integration accepted the write. The integration
      // raises when the robot rejects it (ErrorNO != 0), so a toast here is honest.
      onSuccess?.(t(zoneType === 'mop' ? 'toast.no_mop_zone_saved' : 'toast.zone_saved'));
      return true;
    },
    [hass, entityId, mapTransform, onSuccess, onError, t]
  );

  const handleClean = useCallback(
    async (
      mode: CleaningSelectionMode,
      selectedRooms: Map<number, string>,
      selectedZones: Zone[],
      imageWidth?: number,
      imageHeight?: number,
      repeats: number = 1,
      roomsConfig?: RoomsConfig
    ) => {
      logger.debug('Vacuum', 'Handle clean', {
        mode,
        selectedRooms: Array.from(selectedRooms.entries()),
        selectedZones,
        imageWidth,
        imageHeight,
        repeats,
        roomsConfig,
      });

      switch (mode) {
        case 'all':
          await handleStart();
          break;
        case 'room':
          if (selectedRooms.size > 0) {
            await handleCleanSegments(Array.from(selectedRooms.keys()), selectedRooms.size, repeats, roomsConfig);
          } else {
            logger.debug('Vacuum', 'No rooms selected');
            onSuccess?.(t('toast.select_rooms_first'));
          }
          break;
        case 'zone':
          if (selectedZones.length > 0 && imageWidth && imageHeight) {
            await handleCleanZone(selectedZones, imageWidth, imageHeight, repeats);
          } else if (selectedZones.length > 0) {
            logger.debug('Vacuum', 'Zones selected but no image dimensions');
            onSuccess?.(t('toast.cannot_determine_map'));
          } else {
            logger.debug('Vacuum', 'No zone selected');
            onSuccess?.(t('toast.select_zone_first'));
          }
          break;
      }
    },
    [handleStart, handleCleanSegments, handleCleanZone, onSuccess, t]
  );

  return {
    handleStart,
    handleResume,
    handlePause,
    handleStop,
    handleDock,
    handleCleanSegments,
    handleCleanZone,
    handleSaveNoGoZone,
    handleClean,
  };
}
