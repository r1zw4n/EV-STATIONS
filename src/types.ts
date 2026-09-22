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
  postcode?: string | null;
  dataProviderTitle: string | null;
  dataProviderLicense: string | null;
  mergedCount?: number;
  liveAvailable?: number;
  liveTotal?: number;
  ltaFiltered?: boolean;
  searchRadiusKm?: number;
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
  reason?: string;
  ltaFiltered?: boolean;
  searchRadiusKm?: number;
}

export interface LtaConnector {
  evCpId: string;
  status: string; // "1" for available, "0" for occupied, ""/null for not available
}

export interface LtaPlug {
  plugType: string;
  powerRating: string;
  chargingSpeed: number;
  price: number;
  priceType: string;
  connectors: LtaConnector[];
}

export interface LtaCharger {
  name: string;
  address: string;
  operator: string;
  position: string;
  plugs: LtaPlug[];
}

export interface LtaSiteGroup {
  name: string;
  address: string;
  availableConnectors: number;
  totalConnectors: number;
  chargers: LtaCharger[];
}

export interface LtaAvailabilityApiResponse {
  postalCode?: string;
  totalAvailable?: number;
  totalConnectors?: number;
  groups?: LtaSiteGroup[];
  fetchedAt?: string;
  error?: string;
  variable?: string;
  refused?: boolean;
  unreachable?: boolean;
  upstreamStatus?: number | null;
}

