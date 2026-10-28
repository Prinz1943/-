export type CategoryType = 'high_executives' | 'provincial_office';

export interface Executive {
  id: string;
  name: string;
  position: string;
  category: CategoryType;
  order: number;
}

export interface ScheduleItem {
  id: string;
  executiveId: string;
  category: CategoryType;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09.30 น."
  agenda: string;
  location: string;
  dressCode: string;
  department: string;
  note?: string;
  createdAt?: string;
}

export interface DocumentSettings {
  useThaiNumerals: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  showSeal: boolean;
  sealSize: number;
  customSealUrl?: string;
  provinceName: string;
  adminPasscode: string;
  // Footer document settings (ส่วนล่างของเอกสารตามภาพ)
  showDocumentFooter?: boolean;
  preparedByText?: string;
  statusTimestampOption?: 'auto' | 'custom';
  customStatusTime?: string;
  lastSavedTimestamp?: string;
  printFooterText?: string;
  orientation?: 'portrait' | 'landscape';
}

