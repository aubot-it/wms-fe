export interface WarehouseDTO {
  warehouseId?: number;
  warehouseCode: string;
  warehouseName: string;
  ownerId: string;
  ownerGroupId?: string;
}

export type TemperatureControlType = 'NORMAL' | 'COLD' | 'FROZEN';
export type ZoneUsage = 'INBOUND' | 'OUTBOUND' | 'BOTH';

export interface ZoneDTO {
  zoneID?: number;
  warehouseId: number;
  zoneCode: string;
  zoneName: string;
  temperatureControlType: TemperatureControlType;
  zoneUsage: ZoneUsage;
  zoneType?: string | null;
  abcCategory?: string | null;
  mixingStrategy?: string | null;
  operationMode?: string | null;
  isExternal?: boolean | null;
  isActive?: boolean | null;
}

export interface LocationTypeDTO {
  locationTypeID?: number;
  locationTypeCode: string;
  locationTypeName: string;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  maxWeightKg: number;
  maxVolumeM3: number;
  maxPallets: number;
  maxLayers: number;
  locationType?: number | null;
  shelfType?: string | null;
  oneToManyConfig?: boolean | null;
  isActive?: boolean | null;
}

export interface LocationDTO {
  locationID?: number;
  locationCode: string;
  warehouseID: number;
  zoneID: number;
  locationTypeID: number;
  aisle: string;
  shelfGroup: string;
  depth: string;
  layer: number;
  bay: number;
  side: string;
  pickPriority?: number | null;
  putawayPriority?: number | null;
  isLocked?: boolean | null;
  status?: string | null;
}

export type ListResponse<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      result?: T[];
      total?: number;
      totalCount?: number;
      page?: number;
      pageSize?: number;
      [k: string]: unknown;
    };

export interface PagedResult<T> {
  items: T[];
  total?: number;
}


