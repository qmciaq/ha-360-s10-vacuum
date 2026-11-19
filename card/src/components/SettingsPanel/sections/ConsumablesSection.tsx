import { useCallback } from 'react';
import { useConfirmTap, useTranslation } from '@/hooks';
import { useEntity, useHass } from '@/contexts';
import { getAttr } from '@/utils';
import { availableConsumables } from './consumables';

export function ConsumablesSection() {
  const { t } = useTranslation();
  const entity = useEntity();
  const hass = useHass();
  const { armedKey, tap } = useConfirmTap();
  const attributes = entity.attributes;

  const handleReset = useCallback(
    (consumableKey: string) => {
      hass.callService('botslab_vacuum', 'reset_consumable', {
        entity_id: entity.entity_id,
        consumable_type: consumableKey,
        consumable: consumableKey,
      });
    },
    [hass, entity.entity_id]
  );

  const getProgressColor = (percent: number): string => {
    if (percent >= 50) return 'var(--consumable-good, #34c759)';
    if (percent >= 20) return 'var(--consumable-warning, #ff9500)';
    return 'var(--consumable-critical, #ff3b30)';
  };

  return (
    <div className="consumables-section">
      {availableConsumables(attributes).map((consumable) => {
        const rawPercent = getAttr(attributes[consumable.percentKey] ?? attributes[`${consumable.key}_life_pct`], 0);
        const percent = Math.min(100, Math.max(0, rawPercent));
        const hours = getAttr(
          attributes[consumable.hoursKey] ??
            attributes[`${consumable.key}_left_hours`] ??
            attributes[`${consumable.key}_time_left`],
          0
        );
        const progressColor = getProgressColor(percent);
        const armed = armedKey === consumable.key;

        return (
          <div key={consumable.key} className="consumables-section__item">
            <div className="consumables-section__info">
              <span className="consumables-section__label">{t(consumable.labelKey)}</span>
              <span className="consumables-section__stats">
                {percent}% · {hours}h {t('settings.consumables.remaining')}
              </span>
            </div>
            <div className="consumables-section__progress">
              <div
                className="consumables-section__progress-bar"
                style={{
                  width: `${percent}%`,
                  backgroundColor: progressColor,
                }}
              />
            </div>
            <button
              className={`consumables-section__reset ${armed ? 'consumables-section__reset--armed' : ''}`}
              onClick={() => tap(consumable.key, () => handleReset(consumable.consumableKey))}
              type="button"
            >
              {armed ? t('common.confirm_tap') : t('settings.consumables.reset')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
