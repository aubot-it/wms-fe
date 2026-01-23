export interface WarehouseDTO {
  warehouseId?: number;
  warehouseCode: string;
  warehouseName: string;
  ownerId: number;
  ownerGroupId?: number;
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


