import { ChargingStation } from './types';

/**
 * Single data file holding all invented values for SG CHARGING LOCATER.
 * No real company names, logos, or trademarks are used.
 * Simulated user location: Central Singapore (City Hall / Bras Basah vicinity).
 * Current EV Battery Level: 20%.
 */
export const USER_CURRENT_BATTERY_PCT = 20;
export const USER_CURRENT_LOCATION_LABEL = 'Current Location: Bras Basah / City Hall, Singapore';

export const INVENTED_CHARGING_STATIONS: ChargingStation[] = [
  {
    id: 'sg-stat-01',
    name: 'Bras Basah EcoCharge Pod',
    area: 'Downtown Central',
    address: '25 Bras Basah Road, Basement 2 Lot B04-B07',
    distanceKm: 0.6,
    maxSpeedKw: 120,
    chargeTimeMinutesFrom20: 28,
    chargeTimeLabel: '28 mins to full',
    points: [
      {
        id: 'pt-101',
        bayLabel: 'Point #1 (Bay B04)',
        speedKw: 120,
        connectorType: 'CCS2',
        isAvailable: true,
      },
      {
        id: 'pt-102',
        bayLabel: 'Point #2 (Bay B05)',
        speedKw: 120,
        connectorType: 'CCS2',
        isAvailable: false,
      },
      {
        id: 'pt-103',
        bayLabel: 'Point #3 (Bay B06)',
        speedKw: 50,
        connectorType: 'CCS2',
        isAvailable: true,
      },
      {
        id: 'pt-104',
        bayLabel: 'Point #4 (Bay B07)',
        speedKw: 22,
        connectorType: 'Type 2',
        isAvailable: true,
      },
    ],
  },
  {
    id: 'sg-stat-02',
    name: 'Marina Volt Express Hub',
    area: 'Marina Bay Waterfront',
    address: '10 Bayfront Avenue, South Carpark Level 1',
    distanceKm: 1.2,
    maxSpeedKw: 150,
    chargeTimeMinutesFrom20: 22,
    chargeTimeLabel: '22 mins to full',
    points: [
      {
        id: 'pt-201',
        bayLabel: 'Point #1 (Bay M01)',
        speedKw: 150,
        connectorType: 'CCS2',
        isAvailable: true,
      },
      {
        id: 'pt-202',
        bayLabel: 'Point #2 (Bay M02)',
        speedKw: 150,
        connectorType: 'CCS2',
        isAvailable: true,
      },
      {
        id: 'pt-203',
        bayLabel: 'Point #3 (Bay M03)',
        speedKw: 100,
        connectorType: 'CCS2',
        isAvailable: false,
      },
      {
        id: 'pt-204',
        bayLabel: 'Point #4 (Bay M04)',
        speedKw: 50,
        connectorType: 'CCS2',
        isAvailable: false,
      },
      {
        id: 'pt-205',
        bayLabel: 'Point #5 (Bay M05)',
        speedKw: 22,
        connectorType: 'Type 2',
        isAvailable: true,
      },
    ],
  },
  {
    id: 'sg-stat-03',
    name: 'Orchard Gateway ChargeBay',
    area: 'Orchard Corridor',
    address: '180 Orchard Boulevard, Deck P2 Orange Zone',
    distanceKm: 2.1,
    maxSpeedKw: 60,
    chargeTimeMinutesFrom20: 48,
    chargeTimeLabel: '48 mins to full',
    points: [
      {
        id: 'pt-301',
        bayLabel: 'Point #1 (Bay O11)',
        speedKw: 60,
        connectorType: 'CCS2',
        isAvailable: false,
      },
      {
        id: 'pt-302',
        bayLabel: 'Point #2 (Bay O12)',
        speedKw: 60,
        connectorType: 'CCS2',
        isAvailable: true,
      },
      {
        id: 'pt-303',
        bayLabel: 'Point #3 (Bay O13)',
        speedKw: 22,
        connectorType: 'Type 2',
        isAvailable: false,
      },
    ],
  },
  {
    id: 'sg-stat-04',
    name: 'Raffles GreenPower Depot',
    area: 'Financial District',
    address: '88 Market Street, Basements 3 Bay 12-14',
    distanceKm: 2.8,
    maxSpeedKw: 50,
    chargeTimeMinutesFrom20: 56,
    chargeTimeLabel: '56 mins to full',
    points: [
      {
        id: 'pt-401',
        bayLabel: 'Point #1 (Bay R01)',
        speedKw: 50,
        connectorType: 'CCS2',
        isAvailable: false,
      },
      {
        id: 'pt-402',
        bayLabel: 'Point #2 (Bay R02)',
        speedKw: 50,
        connectorType: 'CCS2',
        isAvailable: true,
      },
      {
        id: 'pt-403',
        bayLabel: 'Point #3 (Bay R03)',
        speedKw: 22,
        connectorType: 'Type 2',
        isAvailable: true,
      },
    ],
  },
];
