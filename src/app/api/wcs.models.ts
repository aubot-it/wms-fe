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

export type AsnType = 'PO' | 'RTV' | 'TRANSFER';
export type AsnStatus = 'CREATED' | 'IN_TRANSIT' | 'ARRIVED' | 'RECEIVING' | 'COMPLETED' | 'CANCELLED';

export interface AsnDTO {
  asnId?: number;
  ownerID: number;
  asnNo: string;
  warehouseID: number;
  asnType: AsnType;
  status: AsnStatus;
  carrierID?: number;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  routeCode?: string;
  dockCode?: string;
  expectedArrival?: string;
  expectedDeparture?: string;
  actualArrival?: string;
  numOfSku?: number;
}


export interface OwnerDTO {
  ownerId?: number;
  ownerCode: string;
  ownerName: string;
  ownerType?: string;
  status?: string;
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  updatedBy?: string;
}


export interface SkuDTO {
  skuID?: number;
  brandId?: number;
  ownerId?: number;
  temperatureType?: string;
  skuCode: string;
  skuName: string;
  baseUom?: string;
  caseUom?: string;
  palletUom?: string;
  caseQty?: number;
  palletQty?: number;
  verificationStatus?: string;
  isBatchControl?: boolean;
  isExpiryControl?: boolean;
  isSerialControl?: boolean;
  abc_Rule?: number;
  velocityClass?: string;
  defaultWeightKg?: number;
  defaultVolumeM3?: number;
  status?: string;
  isActive?: boolean;
}

export interface AsnLineDTO {
  asnLineId?: number;
  asnId: number;
  skuId: number;
  expectedQty: number;
}

export interface LpnDTO {
  lpnId?: number;
  lpnCode: string;
  ownerId?: number;
  warehouseId?: number;
  location?: string;
  parentLpnId?: number | null;
  lpnLevel: string;
  qty: number;
  status: string;
  weightKg?: number | null;
  volumeM3?: number | null;
  closedAt?: string | null;
  createdDate?: string;
  createdBy?: string | null;
  updatedDate?: string | null;
  updatedBy?: string | null;
  asnLineIds?: number[];
}



