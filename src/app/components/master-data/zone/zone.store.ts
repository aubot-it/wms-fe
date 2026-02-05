import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { WcsZoneApi } from '../../../api/wcs-zone.api';
import { WcsWarehouseApi } from '../../../api/wcs-warehouse.api';
import { ToastrService } from 'ngx-toastr';
import {
  LocationDTO,
  LocationTypeDTO,
  TemperatureControlType,
  WarehouseDTO,
  ZoneDTO,
  ZoneUsage,
  ZoneType,
  MixingStrategy,
  OperationMode
} from '../../../api/wcs.models';

@Injectable()
export class ZoneStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsZoneApi);
  private readonly warehouseApi = inject(WcsWarehouseApi);
  private readonly toastr = inject(ToastrService);

  temperatureTypes: TemperatureControlType[] = ['NORMAL', 'COLD', 'FROZEN'];
  zoneUsages: ZoneUsage[] = ['INBOUND', 'OUTBOUND', 'BOTH'];
  zoneTypes: ZoneType[] = ['STORAGE', 'PICK', 'STAGING', 'RECEIVING', 'QC', 'RETURNS', 'VAS'];
  mixingStrategies: MixingStrategy[] = ['Yes', 'No'];
  operationModes: OperationMode[] = ['ASRS', 'COM'];

  warehouses = signal<WarehouseDTO[]>([]);

  allZones = signal<ZoneDTO[]>([]);
  filteredZones = signal<ZoneDTO[]>([]);
  selectedZones = signal<string[]>([]);
  page = signal<number>(1);
  pageSize = signal<number>(20);
  isLastPage = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  drawerOpen = signal<boolean>(false);
  drawerMode = signal<'create' | 'edit'>('create');
  drawerForm: {
    warehouseId: number | null;
    zoneCode: string;
    zoneName: string;
    temperatureControlType: TemperatureControlType;
    zoneUsage: ZoneUsage;
    zoneType: ZoneType | '';
    abcCategory: string;
    mixingStrategy: MixingStrategy | '';
    operationMode: OperationMode | '';
    isExternal: boolean;
    isActive: boolean;
  } = {
    warehouseId: null,
    zoneCode: '',
    zoneName: '',
    temperatureControlType: 'NORMAL',
    zoneUsage: 'BOTH',
    zoneType: 'STORAGE',
    abcCategory: '',
    mixingStrategy: 'Yes',
    operationMode: 'ASRS',
    isExternal: false,
    isActive: true
  };
  private editingZone: ZoneDTO | null = null;

  displayedColumns: string[] = [
    'select',
    'zoneID',
    'zoneCode',
    'zoneName',
    'warehouse',
    'temperatureControlType',
    'zoneUsage',
    'isActive',
    'actions'
  ];

  filters: {
    keyword: string;
    warehouseId: number | null;
    temperatureControlType: '' | TemperatureControlType;
    zoneUsage: '' | ZoneUsage;
    code: string;
    name: string;
  } = {
    keyword: '',
    warehouseId: null,
    temperatureControlType: '',
    zoneUsage: '',
    code: '',
    name: ''
  };

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Xóa Zone: confirm dialog state
  confirmDeleteOpen = signal<boolean>(false);
  confirmDeleteCount = signal<number>(0);
  private pendingDeleteIds: number[] = [];

  // Detail: current zone in focus + its location types / locations
  detailOpen = signal<boolean>(false);
  detailZone = signal<ZoneDTO | null>(null);
  locationTypes = signal<LocationTypeDTO[]>([]);
  locationTypesError = signal<string>('');
  locations = signal<LocationDTO[]>([]);
  selectedLocationTypeKeys = signal<string[]>([]);
  selectedLocationKeys = signal<string[]>([]);
  locationFilters: { locationTypeId: number | null } = { locationTypeId: null };

  // LocationType drawer
  locationTypeDrawerOpen = signal<boolean>(false);
  locationTypeDrawerMode = signal<'create' | 'edit'>('create');
  locationTypeDrawerForm: {
    locationTypeCode: string;
    locationTypeName: string;
    heightCm: number;
    widthCm: number;
    depthCm: number;
    maxWeightKg: number;
    maxVolumeM3: number;
    maxPallets: number;
    maxLayers: number;
    shelfType: string;
    oneToManyConfig: boolean;
    isActive: boolean;
  } = {
    locationTypeCode: '',
    locationTypeName: '',
    heightCm: 0,
    widthCm: 0,
    depthCm: 0,
    maxWeightKg: 0,
    maxVolumeM3: 0,
    maxPallets: 0,
    maxLayers: 0,
    shelfType: '',
    oneToManyConfig: true,
    isActive: true
  };

  // Location drawer (create location in current zone)
  locationDrawerOpen = signal<boolean>(false);
  locationDrawerForm: {
    locationCode: string;
    warehouseId: number | null;
    zoneId: number | null;
    locationTypeId: number | null;
    aisle: string;
    shelfGroup: string;
    depth: string;
    layer: number;
    bay: number;
    side: string;
    pickPriority: number;
    putawayPriority: number;
    isLocked: boolean;
    status: string;
  } = {
    locationCode: '',
    warehouseId: null,
    zoneId: null,
    locationTypeId: null,
    aisle: '',
    shelfGroup: '',
    depth: '',
    layer: 0,
    bay: 0,
    side: '',
    pickPriority: 0,
    putawayPriority: 0,
    isLocked: false,
    status: ''
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reloadWarehouses();
      this.reloadFromApi();
    }
  }

  applyFilters(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  applyClientFilters(): void {
    let filtered = [...this.allZones()];

    if (this.filters.code) {
      filtered = filtered.filter((z) =>
        (z.zoneCode || '').toLowerCase().includes(this.filters.code.toLowerCase())
      );
    }
    if (this.filters.name) {
      filtered = filtered.filter((z) =>
        (z.zoneName || '').toLowerCase().includes(this.filters.name.toLowerCase())
      );
    }

    this.filteredZones.set(filtered);
  }

  clearFilters(): void {
    this.filters = {
      keyword: '',
      warehouseId: null,
      temperatureControlType: '',
      zoneUsage: '',
      code: '',
      name: ''
    };
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  toggleSelect(id: string): void {
    const selected = this.selectedZones();
    if (selected.includes(id)) {
      this.selectedZones.set(selected.filter((s) => s !== id));
    } else {
      this.selectedZones.set([...selected, id]);
    }
  }

  toggleSelectAll(event: { checked: boolean }): void {
    const checked = event.checked;
    if (checked) {
      this.selectedZones.set(this.filteredZones().map((z) => this.rowKey(z)));
    } else {
      this.selectedZones.set([]);
    }
  }

  isSomeSelected(): boolean {
    const filtered = this.filteredZones();
    const selectedCount = filtered.filter((z) => this.isSelected(this.rowKey(z))).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  isSelected(id: string): boolean {
    return this.selectedZones().includes(id);
  }

  isAllSelected(): boolean {
    const filtered = this.filteredZones();
    return filtered.length > 0 && filtered.every((z) => this.isSelected(this.rowKey(z)));
  }

  prevPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.page() === 1 || this.isLoading()) return;
    this.page.update((p) => Math.max(1, p - 1));
    this.reloadFromApi();
  }

  nextPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isLastPage() || this.isLoading()) return;
    this.page.update((p) => p + 1);
    this.reloadFromApi();
  }

  onPageSizeChange(size: number | string): void {
    const v = Number(size);
    if (!Number.isFinite(v) || v <= 0) return;
    this.pageSize.set(v);
    this.page.set(1);
    if (!isPlatformBrowser(this.platformId)) return;
    this.reloadFromApi();
  }

  goToPage(p: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (p === this.page() || p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.reloadFromApi();
  }

  onDelete(): void {
    const selected = this.selectedZones();
    if (selected.length === 0) {
      this.toastr.warning('Vui lòng chọn ít nhất 1 zone để xóa.');
      return;
    }

    const ids = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];
    if (ids.length === 0) {
      this.toastr.error('Không xác định được zoneID để xóa (API yêu cầu id dạng số).');
      return;
    }

    this.pendingDeleteIds = ids;
    this.confirmDeleteCount.set(ids.length);
    this.confirmDeleteOpen.set(true);
  }

  cancelDelete(): void {
    this.confirmDeleteOpen.set(false);
    this.pendingDeleteIds = [];
  }

  confirmDelete(): void {
    const ids = this.pendingDeleteIds;
    if (ids.length === 0) {
      this.confirmDeleteOpen.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.confirmDeleteOpen.set(false);

    let done = 0;
    ids.forEach((id) => {
      this.api.deleteZone(id).subscribe({
        next: (res: any) => {
          done++;

          const success =
            res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
          const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

          if (success) {
            this.toastr.success(msg || `Xóa zone (ID: ${id}) thành công.`);
          } else {
            this.toastr.error(msg || `Xóa zone (ID: ${id}) không thành công.`);
          }

          if (done === ids.length) {
            this.isLoading.set(false);
            this.pendingDeleteIds = [];
            this.reloadFromApi();
          }
        },
        error: (err) => {
          done++;
          const backendMsg =
            (err?.error &&
              typeof err.error === 'object' &&
              'message' in err.error &&
              (err.error as any).message) ||
            (err?.error && typeof err.error === 'string' ? err.error : null);
          const fallback = err?.message || `HTTP ${err?.status ?? ''}`;
          const msg = backendMsg || fallback || `Lỗi khi xóa zone (ID: ${id}).`;
          this.errorMessage.set(msg);
          this.toastr.error(msg);

          if (done === ids.length) {
            this.isLoading.set(false);
            this.pendingDeleteIds = [];
            this.reloadFromApi();
          }
        }
      });
    });
  }

  openCreateDrawer(): void {
    this.drawerMode.set('create');
    this.drawerForm = {
      warehouseId: this.filters.warehouseId ?? null,
      zoneCode: '',
      zoneName: '',
      temperatureControlType: 'NORMAL',
      zoneUsage: 'BOTH',
      zoneType: 'STORAGE',
      abcCategory: '',
      mixingStrategy: 'Yes',
      operationMode: 'ASRS',
      isExternal: false,
      isActive: true
    };
    this.editingZone = null;
    this.drawerOpen.set(true);
  }

  openEditDrawer(): void {
    const selected = this.selectedZones();
    if (selected.length !== 1) return;

    const zone = this.allZones().find((z) => this.rowKey(z) === selected[0]);
    if (!zone) return;

    this.drawerMode.set('edit');
    this.editingZone = zone;
    this.drawerForm = {
      warehouseId: zone.warehouseId ?? null,
      zoneCode: zone.zoneCode,
      zoneName: zone.zoneName,
      temperatureControlType: zone.temperatureControlType,
      zoneUsage: zone.zoneUsage,
      zoneType: (zone.zoneType ?? '') as ZoneType | '',
      abcCategory: (zone.abcCategory ?? '') as string,
      mixingStrategy: (zone.mixingStrategy ?? '') as MixingStrategy | '',
      operationMode: (zone.operationMode ?? '') as OperationMode | '',
      isExternal: Boolean(zone.isExternal),
      isActive: zone.isActive == null ? true : Boolean(zone.isActive)
    };
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingZone = null;
  }

  submitDrawer(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const warehouseId = this.drawerForm.warehouseId;
    const zoneCode = (this.drawerForm.zoneCode || '').trim();
    const zoneName = (this.drawerForm.zoneName || '').trim();

    if (warehouseId == null || !Number.isFinite(warehouseId) || !zoneCode || !zoneName) {
      this.toastr.warning('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    const payload: ZoneDTO = {
      warehouseId,
      zoneCode,
      zoneName,
      temperatureControlType: this.drawerForm.temperatureControlType,
      zoneUsage: this.drawerForm.zoneUsage,
      zoneType: this.drawerForm.zoneType ? (this.drawerForm.zoneType as ZoneType) : null,
      abcCategory: this.drawerForm.abcCategory?.trim() || null,
      mixingStrategy: this.drawerForm.mixingStrategy
        ? (this.drawerForm.mixingStrategy as MixingStrategy)
        : null,
      operationMode: this.drawerForm.operationMode
        ? (this.drawerForm.operationMode as OperationMode)
        : null,
      isExternal: this.drawerForm.isExternal,
      isActive: this.drawerForm.isActive
    };

    this.isLoading.set(true);

    const isCreate = this.drawerMode() === 'create';
    const req$ = isCreate
      ? this.api.createZone(payload)
      : this.api.updateZone(
          this.editingZone?.zoneID != null ? { ...payload, zoneID: this.editingZone.zoneID } : payload
        );

    req$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.closeDrawer();
        this.reloadFromApi();

        const success =
          res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
        const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

        if (success) {
          this.toastr.success(msg || (isCreate ? 'Tạo Zone thành công.' : 'Cập nhật Zone thành công.'));
        } else {
          this.toastr.error(msg || 'Thao tác với Zone không thành công.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const backendMsg =
          (err?.error &&
            typeof err.error === 'object' &&
            'message' in err.error &&
            (err.error as any).message) ||
          (err?.error && typeof err.error === 'string' ? err.error : null);
        const fallback = err?.message || `HTTP ${err?.status ?? ''}`;
        const msg = backendMsg || fallback || 'Lỗi khi lưu Zone, vui lòng thử lại.';
        this.errorMessage.set(msg);
        this.toastr.error(msg);
      }
    });
  }

  /** Chuẩn hóa zone từ API: backend có thể trả zoneId/ZoneId thay vì zoneID */
  private normalizeZone(z: ZoneDTO): ZoneDTO {
    const raw = z as unknown as Record<string, unknown>;
    const id = raw['zoneID'] ?? raw['zoneId'] ?? raw['ZoneId'];
    const numId = id != null && Number.isFinite(Number(id)) ? Number(id) : undefined;
    return { ...z, zoneID: numId ?? z.zoneID };
  }

  rowKey(z: ZoneDTO): string {
    return z.zoneID != null ? String(z.zoneID) : z.zoneCode;
  }

  warehouseKey(w: WarehouseDTO): string {
    return w.warehouseId != null ? String(w.warehouseId) : w.warehouseCode;
  }

  warehouseLabel(warehouseId: number): string {
    const w = this.warehouses().find((x) => x.warehouseId === warehouseId);
    return w ? `${w.warehouseCode} - ${w.warehouseName}` : String(warehouseId ?? '-');
  }

  fromIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredZones().length);
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  private reloadWarehouses(): void {
    this.warehouseApi.getWarehouseList({ page: 1, pageSize: 1000 }).subscribe({
      next: (result) => {
        this.warehouses.set(result.items ?? []);
      },
      error: () => {
        this.warehouses.set([]);
      }
    });
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api
      .getZoneList({
        keyword: (this.filters.keyword || '').trim(),
        warehouseId: this.filters.warehouseId ?? undefined,
        temperatureControlType: this.filters.temperatureControlType || undefined,
        zoneUsage: this.filters.zoneUsage || undefined,
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (result) => {
          const rawList = result.items ?? [];
          const list = rawList.map((z) => this.normalizeZone(z));
          const total = result.total ?? list.length;

          this.allZones.set(list);
          this.applyClientFilters();
          this.selectedZones.set([]);
          this.totalItems.set(total);
          const totalPages = Math.max(1, Math.ceil(total / this.pageSize()));
          this.totalPages.set(totalPages);
          this.isLastPage.set(this.page() >= totalPages || list.length < this.pageSize());
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg =
            (err?.error && typeof err.error === 'string' ? err.error : '') ||
            err?.message ||
            `HTTP ${err?.status ?? ''} ${err?.statusText ?? ''}`.trim();
          this.errorMessage.set(msg || 'Unknown error');
          this.allZones.set([]);
          this.filteredZones.set([]);
          this.selectedZones.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLastPage.set(true);
        }
      });
  }

  // ---------- Detail: open / close ----------
  openDetail(zone: ZoneDTO): void {
    this.detailZone.set(zone);
    this.detailOpen.set(true);
    this.locationFilters = { locationTypeId: null };
    this.reloadDetailForCurrentZone();
  }

  closeDetail(): void {
    this.detailOpen.set(false);
  }

  // ---------- Detail: LocationType + Location ----------
  private getDetailZone(): ZoneDTO | null {
    return this.detailZone();
  }

  private reloadDetailForCurrentZone(): void {
    const zone = this.getDetailZone();
    this.locationTypesError.set('');
    if (!zone || zone.zoneID == null || zone.warehouseId == null) {
      this.locationTypes.set([]);
      this.locations.set([]);
      this.selectedLocationTypeKeys.set([]);
      this.selectedLocationKeys.set([]);
      return;
    }

    // Load all location types (keyword optional; backend may return items/data/result/locationTypes)
    this.api
      .getLocationTypeList({ page: 1, pageSize: 1000 })
      .subscribe({
        next: (res) => {
          this.locationTypes.set(res?.items ?? []);
          this.locationTypesError.set('');
        },
        error: (err) => {
          this.locationTypes.set([]);
          this.locationTypesError.set(err?.error?.message ?? err?.message ?? 'Không tải được danh sách Location Type');
        }
      });

    this.reloadLocationsForZone(zone);
  }

  reloadLocations(): void {
    this.reloadLocationsForZone(this.getDetailZone());
  }

  /** Chọn Location Type ở bảng giữa để lọc danh sách location vật lý bên trái */
  selectLocationTypeForFilter(lt: LocationTypeDTO | null): void {
    this.locationFilters = { locationTypeId: lt?.locationTypeID ?? null };
    this.reloadLocations();
  }

  private reloadLocationsForZone(zone: ZoneDTO | null): void {
    if (!zone || zone.zoneID == null || zone.warehouseId == null) {
      this.locations.set([]);
      this.selectedLocationKeys.set([]);
      return;
    }

    const locationTypeId = this.locationFilters.locationTypeId;

    this.api
      .getLocationList({
        keyword: undefined,
        warehouseId: zone.warehouseId,
        zoneId: zone.zoneID,
        locationTypeId: locationTypeId ?? undefined,
        page: 1,
        pageSize: 1000
      })
      .subscribe({
        next: (res) => this.locations.set(res.items ?? []),
        error: () => this.locations.set([])
      });
  }

  // Selection for LocationType and Location (for future actions)
  toggleLocationTypeSelect(id: string): void {
    const selected = this.selectedLocationTypeKeys();
    if (selected.includes(id)) {
      this.selectedLocationTypeKeys.set(selected.filter((s) => s !== id));
    } else {
      this.selectedLocationTypeKeys.set([...selected, id]);
    }
  }

  isLocationTypeSelected(id: string): boolean {
    return this.selectedLocationTypeKeys().includes(id);
  }

  locationTypeKey(lt: LocationTypeDTO): string {
    return lt.locationTypeID != null ? String(lt.locationTypeID) : lt.locationTypeCode;
  }

  toggleLocationSelect(id: string): void {
    const selected = this.selectedLocationKeys();
    if (selected.includes(id)) {
      this.selectedLocationKeys.set(selected.filter((s) => s !== id));
    } else {
      this.selectedLocationKeys.set([...selected, id]);
    }
  }

  isLocationSelected(id: string): boolean {
    return this.selectedLocationKeys().includes(id);
  }

  locationKey(l: LocationDTO): string {
    return l.locationID != null ? String(l.locationID) : l.locationCode;
  }


  createLocationType(): void {
    // Mở drawer create LocationType
    this.locationTypeDrawerMode.set('create');
    this.locationTypeDrawerForm = {
      locationTypeCode: '',
      locationTypeName: '',
      heightCm: 0,
      widthCm: 0,
      depthCm: 0,
      maxWeightKg: 0,
      maxVolumeM3: 0,
      maxPallets: 0,
      maxLayers: 0,
      shelfType: '',
      oneToManyConfig: true,
      isActive: true
    };
    this.locationTypeDrawerOpen.set(true);
  }

  closeLocationTypeDrawer(): void {
    this.locationTypeDrawerOpen.set(false);
  }

  submitLocationTypeDrawer(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const f = this.locationTypeDrawerForm;
    const code = (f.locationTypeCode || '').trim();
    const name = (f.locationTypeName || '').trim();
    const shelfType = (f.shelfType || '').trim();

    if (!code || !name) {
      alert('Vui lòng nhập đầy đủ LocationTypeCode và LocationTypeName');
      return;
    }
    if (!Number.isFinite(f.heightCm) && f.heightCm !== 0) {
      alert('Vui lòng nhập Height (cm)');
      return;
    }
    if (!Number.isFinite(f.widthCm) && f.widthCm !== 0) {
      alert('Vui lòng nhập Width (cm)');
      return;
    }
    if (!Number.isFinite(f.depthCm) && f.depthCm !== 0) {
      alert('Vui lòng nhập Depth (cm)');
      return;
    }
    if (!Number.isFinite(f.maxWeightKg) && f.maxWeightKg !== 0) {
      alert('Vui lòng nhập Max Weight (kg)');
      return;
    }
    if (!Number.isFinite(f.maxVolumeM3) && f.maxVolumeM3 !== 0) {
      alert('Vui lòng nhập Max Volume (m3)');
      return;
    }
    if (!Number.isFinite(f.maxPallets) && f.maxPallets !== 0) {
      alert('Vui lòng nhập Max Pallets');
      return;
    }
    if (!Number.isFinite(f.maxLayers) && f.maxLayers !== 0) {
      alert('Vui lòng nhập Max Layers');
      return;
    }
    if (!shelfType) {
      alert('Vui lòng nhập Shelf Type');
      return;
    }

    const payload: LocationTypeDTO = {
      locationTypeCode: code,
      locationTypeName: name,
      heightCm: Number.isFinite(f.heightCm) ? f.heightCm : 0,
      widthCm: Number.isFinite(f.widthCm) ? f.widthCm : 0,
      depthCm: Number.isFinite(f.depthCm) ? f.depthCm : 0,
      maxWeightKg: Number.isFinite(f.maxWeightKg) ? f.maxWeightKg : 0,
      maxVolumeM3: Number.isFinite(f.maxVolumeM3) ? f.maxVolumeM3 : 0,
      maxPallets: Number.isFinite(f.maxPallets) ? f.maxPallets : 0,
      maxLayers: Number.isFinite(f.maxLayers) ? f.maxLayers : 0,
      locationType: null,
      shelfType: shelfType || null,
      oneToManyConfig: f.oneToManyConfig,
      isActive: f.isActive
    };

    this.isLoading.set(true);
    this.api.createLocationType(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeLocationTypeDrawer();
        this.reloadDetailForCurrentZone();
        alert('Tạo LocationType thành công');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
        alert('Tạo LocationType thất bại, vui lòng kiểm tra log / backend.');
      }
    });
  }

  openLocationDrawer(): void {
    const zone = this.getDetailZone();
    if (!zone || zone.zoneID == null || zone.warehouseId == null) {
      alert('Vui lòng mở chi tiết Zone trước khi tạo Location.');
      return;
    }
    this.locationDrawerForm = {
      locationCode: '',
      warehouseId: zone.warehouseId,
      zoneId: zone.zoneID,
      locationTypeId: this.locationFilters.locationTypeId ?? null,
      aisle: '',
      shelfGroup: '',
      depth: '',
      layer: 0,
      bay: 0,
      side: '',
      pickPriority: 0,
      putawayPriority: 0,
      isLocked: false,
      status: ''
    };
    this.locationDrawerOpen.set(true);
  }

  closeLocationDrawer(): void {
    this.locationDrawerOpen.set(false);
  }

  submitLocationDrawer(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const f = this.locationDrawerForm;
    const locationCode = (f.locationCode || '').trim();
    const warehouseId = f.warehouseId;
    const zoneId = f.zoneId;
    const locationTypeId = f.locationTypeId;

    if (!locationCode || warehouseId == null || zoneId == null || locationTypeId == null) {
      alert('Vui lòng nhập LocationCode và chọn Warehouse, Zone, LocationType.');
      return;
    }

    const payload: LocationDTO = {
      locationCode,
      warehouseID: warehouseId,
      zoneID: zoneId,
      locationTypeID: locationTypeId,
      aisle: (f.aisle || '').trim(),
      shelfGroup: (f.shelfGroup || '').trim(),
      depth: (f.depth || '').trim(),
      layer: Number.isFinite(f.layer) ? f.layer : 0,
      bay: Number.isFinite(f.bay) ? f.bay : 0,
      side: (f.side || '').trim(),
      pickPriority: Number.isFinite(f.pickPriority) ? f.pickPriority : 0,
      putawayPriority: Number.isFinite(f.putawayPriority) ? f.putawayPriority : 0,
      isLocked: f.isLocked,
      status: (f.status || '').trim() || undefined
    };

    this.isLoading.set(true);
    this.api.createLocation(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.closeLocationDrawer();
        this.reloadDetailForCurrentZone();
        alert('Tạo Location thành công.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
        alert('Tạo Location thất bại');
      }
    });
  }
}


