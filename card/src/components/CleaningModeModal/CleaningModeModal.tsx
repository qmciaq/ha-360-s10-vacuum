import { useState } from 'react';
import { Modal, SegmentedControl } from '@/components/common';
import { CustomMode } from './CustomMode';
import { CustomizeMode } from './CustomizeMode';
import { useVacuumEntityIds, readSelectEntity } from '@/hooks';
import { useTranslation } from '@/hooks/useTranslation';
import { useEntity, useHass, useMachineState } from '@/contexts';
import { getAttr } from '@/utils';
import { DEFAULTS } from '@/constants';

interface CleaningModeModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CleaningModeModal({ opened, onClose }: CleaningModeModalProps) {
  const { t } = useTranslation();
  const entity = useEntity();
  const hass = useHass();
  const { phase } = useMachineState();
  const entityIds = useVacuumEntityIds();
  const isInCleaningSession = phase === 'cleaning' || phase === 'paused';

  const selectEntity = (entityId: string | undefined) => readSelectEntity(entityId ? hass.states[entityId] : undefined);
  const cleaningModeSelect = selectEntity(entityIds.cleaningMode);
  const suctionLevelSelect = selectEntity(entityIds.suctionLevel);
  const waterVolumeSelect = selectEntity(entityIds.waterVolume);
  const mopPadHumiditySelect = selectEntity(entityIds.mopPadHumidity);
  const cleaningRouteSelect = selectEntity(entityIds.cleaningRoute);
  const selfCleanFrequencySelect = selectEntity(entityIds.selfCleanFrequency);

  const cleaningMode = cleaningModeSelect.value ?? getAttr(entity.attributes.cleaning_mode, '');
  const suctionLevel = suctionLevelSelect.value ?? '';
  const wetnessLevel = getAttr(entity.attributes.wetness_level, DEFAULTS.WETNESS_LEVEL);
  const waterVolume = waterVolumeSelect.value ?? '';
  const cleaningRoute = cleaningRouteSelect.value ?? '';
  const maxSuctionPower = getAttr(entity.attributes.max_suction_power, DEFAULTS.MAX_SUCTION_POWER);
  const selfCleanArea = getAttr(entity.attributes.self_clean_area, DEFAULTS.SELF_CLEAN_AREA);
  const selfCleanFrequency = selfCleanFrequencySelect.value ?? '';
  const mopPadHumidity = mopPadHumiditySelect.value ?? '';

  const selfCleanAreaMin = getAttr(entity.attributes.self_clean_area_min, DEFAULTS.SELF_CLEAN_AREA_MIN);
  const selfCleanAreaMax = getAttr(entity.attributes.self_clean_area_max, DEFAULTS.SELF_CLEAN_AREA_MAX);
  const selfCleanTime = getAttr(entity.attributes.previous_self_clean_time, DEFAULTS.SELF_CLEAN_TIME);
  const selfCleanTimeMin = getAttr(entity.attributes.self_clean_time_min, DEFAULTS.SELF_CLEAN_TIME_MIN);
  const selfCleanTimeMax = getAttr(entity.attributes.self_clean_time_max, DEFAULTS.SELF_CLEAN_TIME_MAX);

  const [activeTab, setActiveTab] = useState<'standard' | 'room'>('standard');

  const tabOptions = [
    { value: 'standard', label: t('cleaning_mode.custom') || 'Standard' },
    { value: 'room', label: t('customize.title') || 'Room Customized' },
  ];

  return (
    <Modal opened={opened} onClose={onClose}>
      <div className="cleaning-mode-modal">
        <div className="cleaning-mode-modal__header">
          <SegmentedControl
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'standard' | 'room')}
            options={tabOptions}
            disabled={isInCleaningSession}
          />
        </div>

        <div className="cleaning-mode-modal__content-wrapper">
          {activeTab === 'standard' ? (
            <CustomMode
              cleaningMode={cleaningMode}
              cleaningModeList={cleaningModeSelect.options}
              suctionLevel={suctionLevel}
              suctionLevelList={suctionLevelSelect.options}
              wetnessLevel={wetnessLevel}
              mopPadHumidity={mopPadHumidity}
              mopPadHumidityList={mopPadHumiditySelect.options}
              waterVolume={waterVolume}
              waterVolumeList={waterVolumeSelect.options}
              cleaningRoute={cleaningRoute}
              cleaningRouteList={cleaningRouteSelect.options}
              maxSuctionPower={maxSuctionPower}
              selfCleanArea={selfCleanArea}
              selfCleanFrequency={selfCleanFrequency}
              selfCleanFrequencyList={selfCleanFrequencySelect.options}
              selfCleanAreaMin={selfCleanAreaMin}
              selfCleanAreaMax={selfCleanAreaMax}
              selfCleanTime={selfCleanTime}
              selfCleanTimeMin={selfCleanTimeMin}
              selfCleanTimeMax={selfCleanTimeMax}
            />
          ) : (
            <CustomizeMode />
          )}
        </div>
      </div>
    </Modal>
  );
}
