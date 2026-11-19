import { useState } from 'react';
import type { AreaSelectionMode, CleaningSelectionMode, StopAction } from '@/types/homeassistant';
import { useTranslation, useButtonConfig } from '@/hooks';
import { useEntity, useMachineState, useLanguage } from '@/contexts';
import { DockPopup } from '@/components/DockPopup';
import { shouldOpenDockPopup } from '@/utils/dockPopup';
import { CleanButton, PauseButton, ResumeButton, StopButton, DockButton } from './components';

interface ActionButtonsProps {
  selectedMode: CleaningSelectionMode;
  areaSelectionMode: AreaSelectionMode;
  selectedRoomsCount: number;
  selectedZonesCount?: number;
  onClean: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: (action: StopAction) => void;
  onDock: () => void;
}

export function ActionButtons({
  selectedMode,
  areaSelectionMode,
  selectedRoomsCount,
  selectedZonesCount = 0,
  onClean,
  onPause,
  onResume,
  onStop,
  onDock,
}: ActionButtonsProps) {
  const { t, getRoomCountTranslation } = useTranslation();
  const { getStopAction } = useButtonConfig();
  const entity = useEntity();
  const lang = useLanguage();
  const { phase, controls } = useMachineState();
  const [dockPopupOpened, setDockPopupOpened] = useState(false);

  const stopAction = getStopAction();
  const opensDockPopup = shouldOpenDockPopup(phase, entity.state);

  const getCleanButtonText = (): string => {
    switch (selectedMode) {
      case 'room':
        return getRoomCountTranslation(selectedRoomsCount);
      case 'all':
        return t('actions.clean_all');
      case 'zone':
        if (areaSelectionMode === 'no_go') return lang === 'tr' ? 'Yasak Alanı Kaydet' : 'Save No-Go Zone';
        if (areaSelectionMode === 'no_mop') return lang === 'tr' ? 'Paspas Yasak Alanı Kaydet' : 'Save No-Mop Zone';
        return t('actions.zone_clean');
      default:
        return t('actions.clean');
    }
  };

  const handleStop = () => onStop(stopAction);
  const hasRequiredSelection =
    selectedMode !== 'zone' ||
    (areaSelectionMode === 'no_go' || areaSelectionMode === 'no_mop'
      ? selectedZonesCount > 0
      : true);
  const handleDockClick = (): void => {
    if (opensDockPopup) {
      setDockPopupOpened(true);
      return;
    }
    onDock();
  };

  if (phase === 'cleaning') {
    return (
      <div className="action-buttons">
        <PauseButton onClick={onPause} disabled={!controls.canPause} />
        <StopButton onClick={handleStop} action={stopAction} disabled={!controls.canStop} />
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div className="action-buttons">
        <ResumeButton onClick={onResume} disabled={!controls.canResume} />
        <StopButton onClick={handleStop} action={stopAction} disabled={!controls.canStop} />
      </div>
    );
  }

  return (
    <>
      <div className="action-buttons">
        <CleanButton
          onClick={onClean}
          text={getCleanButtonText()}
          disabled={!controls.canStartCleaning || !hasRequiredSelection}
        />
        <DockButton onClick={handleDockClick} disabled={!controls.canDock && !opensDockPopup} />
      </div>
      <DockPopup opened={dockPopupOpened} onClose={() => setDockPopupOpened(false)} />
    </>
  );
}
