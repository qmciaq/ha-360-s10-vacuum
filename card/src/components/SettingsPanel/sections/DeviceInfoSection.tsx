import { useTranslation } from '@/hooks';
import { useAreaUnit, useEntity } from '@/contexts';
import { getAttr, isString, isNumber } from '@/utils';

interface InfoItem {
  labelKey: string;
  value: string | number;
  unit?: string;
}

export function DeviceInfoSection() {
  const { t } = useTranslation();
  const areaUnit = useAreaUnit();
  const entity = useEntity();
  const attributes = entity.attributes;

  const rawFirmware = attributes.firmware_version ?? attributes.sw_version ?? attributes.version;
  const firmwareVersion = isString(rawFirmware) || isNumber(rawFirmware) ? rawFirmware : '-';
  const totalCleanedArea = getAttr(attributes.total_cleaned_area ?? attributes.total_cleaning_area_sqm, 0);
  const totalCleaningTime = getAttr(attributes.total_cleaning_time ?? attributes.total_cleaning_time_minutes, 0);
  const cleaningCount = getAttr(attributes.cleaning_count ?? attributes.tasks_total_count, 0);

  // Network info is nested under 'ap' in some implementations
  const apInfo =
    attributes.ap && typeof attributes.ap === 'object'
      ? (attributes.ap as { ssid?: unknown; rssi?: unknown; ip?: unknown })
      : undefined;

  const rawSsid =
    apInfo?.ssid && apInfo.ssid !== '-'
      ? apInfo.ssid
      : (attributes.wifi_ssid ?? attributes.ssid ?? '-');
  const wifiSsid: string | number =
    isString(rawSsid) || isNumber(rawSsid) ? rawSsid : '-';

  const rawRssi =
    apInfo?.rssi !== undefined && apInfo.rssi !== '-'
      ? apInfo.rssi
      : (attributes.wifi_rssi ?? attributes.rssi ?? '-');
  const wifiRssi: string | number =
    isString(rawRssi) || isNumber(rawRssi) ? rawRssi : '-';

  const rawIp =
    apInfo?.ip && apInfo.ip !== '-'
      ? apInfo.ip
      : (attributes.ip_address ?? attributes.ip ?? '-');
  const wifiIp: string | number =
    isString(rawIp) || isNumber(rawIp) ? rawIp : '-';

  const hasRssi = wifiRssi !== '-' && wifiRssi !== '' && wifiRssi !== undefined && wifiRssi !== null;

  const infoItems: InfoItem[] = [
    { labelKey: 'settings.device_info.firmware', value: firmwareVersion },
    { labelKey: 'settings.device_info.total_area', value: totalCleanedArea, unit: areaUnit },
    { labelKey: 'settings.device_info.total_time', value: totalCleaningTime, unit: t('units.minutes') },
    { labelKey: 'settings.device_info.total_cleans', value: cleaningCount },
    { labelKey: 'settings.device_info.wifi_ssid', value: wifiSsid },
    { labelKey: 'settings.device_info.wifi_signal', value: wifiRssi, unit: hasRssi ? t('units.decibels') : undefined },
    { labelKey: 'settings.device_info.ip_address', value: wifiIp },
  ];

  return (
    <div className="device-info-section">
      {infoItems.map((item) => (
        <div key={item.labelKey} className="device-info-section__item">
          <span className="device-info-section__label">{t(item.labelKey)}</span>
          <span className="device-info-section__value">
            {item.value}
            {item.unit && ` ${item.unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}
