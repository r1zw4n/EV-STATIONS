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
