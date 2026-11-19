import { useTranslation } from '@/hooks/useTranslation';
import { useMachineState } from '@/contexts';
import { VACUUM_MOP_ICON_SVG, CUSTOMIZE_ICON_SVG } from '@/constants/icons';
import type { RepeatCount } from '@/hooks/useCardUIState';
import {
  getCleaningModeIcon,
  getCleaningModeFriendlyName,
} from '@/utils';

interface CleaningModeButtonProps {
  cleaningMode: string;
  cleanGeniusMode?: string;
  cleangenius?: string;
  onClick: () => void;
  onShortcutsClick?: () => void;
  onRepeatClick?: () => void;
  repeatCount?: RepeatCount;
}

export function CleaningModeButton({
  cleaningMode,
  onClick,
  onRepeatClick,
  repeatCount = 1,
}: CleaningModeButtonProps) {
  const { t } = useTranslation();
  const { phase, isCustomizedCleaning } = useMachineState();

  const isInCleaningSession = phase === 'cleaning' || phase === 'paused';
  const secondaryDisabled = isInCleaningSession;

  const getIcon = (mode: string) => {
    if (isCustomizedCleaning) {
      return CUSTOMIZE_ICON_SVG;
    }
    return getCleaningModeIcon(mode) || VACUUM_MOP_ICON_SVG;
  };

  const getCleaningModeText = (mode: string): string => {
    if (isCustomizedCleaning) return t('customize.title');
    return getCleaningModeFriendlyName(mode, t) || t('cleaning_mode.custom');
  };

  const handleRepeatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRepeatClick?.();
  };

  return (
    <div className="cleaning-mode-button-wrapper">
      <button onClick={onClick} className="cleaning-mode-button" type="button">
        <div className="cleaning-mode-button__content">
          <span className="cleaning-mode-button__icon">{getIcon(cleaningMode)}</span>
          <span className="cleaning-mode-button__text">
            {getCleaningModeText(cleaningMode)}
          </span>
        </div>
        <span className="cleaning-mode-button__arrow">›</span>
      </button>
      {onRepeatClick && (
        <button
          type="button"
          className={`cleaning-mode-button-wrapper__repeats ${secondaryDisabled ? 'cleaning-mode-button-wrapper__repeats--disabled' : ''}`}
          onClick={handleRepeatClick}
          title={t('cleaning_mode_button.repeats_tooltip')}
          disabled={secondaryDisabled}
        >
          x{repeatCount}
        </button>
      )}
    </div>
  );
}
