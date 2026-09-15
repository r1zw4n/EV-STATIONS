export type ScreenId = 'screen1' | 'screen2';

export type SortMode = 'nearest' | 'fastest';

export type ConnectorType = 'CCS2' | 'Type 2';

export interface ChargingPoint {
  id: string;
  bayLabel: string;
  speedKw: number;
  connectorType: ConnectorType;
  isAvailable: boolean;
}

export interface ChargingStation {
  id: string;
  name: string;
  area: string;
  address: string;
  distanceKm: number;
  maxSpeedKw: number;
  chargeTimeMinutesFrom20: number;
  chargeTimeLabel: string;
  points: ChargingPoint[];
}

export interface LiveStation {
  id: number | string;
  title: string;
  addressLine: string;
  town: string;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  highestPowerKW: number | null;
  numberOfPoints: number | null;
  dataProviderTitle: string | null;
  dataProviderLicense: string | null;
}

export interface LiveStationsApiResponse {
  stations?: LiveStation[];
  dataProviderTitle?: string | null;
  dataProviderLicense?: string | null;
  error?: string;
  variable?: string;
  refused?: boolean;
  unreachable?: boolean;
  upstreamStatus?: number | null;
}
