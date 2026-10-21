export const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

export function toThaiNumerals(str: string | number): string {
  return String(str).replace(/[0-9]/g, (digit) => THAI_DIGITS[parseInt(digit, 10)]);
}

export function toArabicNumerals(str: string): string {
  const map: Record<string, string> = {
    '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
    '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
  };
  return str.replace(/[๐-๙]/g, (ch) => map[ch] ?? ch);
}

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_DAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
];

export function formatThaiDateTitle(dateStr: string, useThaiNumerals = true): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const dateObj = new Date(year, month, day);
  const dayOfWeek = THAI_DAYS_FULL[dateObj.getDay()];
  const monthName = THAI_MONTHS_FULL[month];
  const buddhistYear = year + 543;

  if (useThaiNumerals) {
    const thaiDay = toThaiNumerals(day);
    const thaiYear = toThaiNumerals(buddhistYear);
    return `${dayOfWeek}ที่ ${thaiDay} ${monthName} ${thaiYear}`;
  } else {
    return `${dayOfWeek}ที่ ${day} ${monthName} ${buddhistYear}`;
  }
}

export function formatTimeDisplay(timeStr: string, useThaiNumerals = true): string {
  if (!timeStr) return '';
  if (useThaiNumerals) {
    return toThaiNumerals(timeStr);
  }
  return timeStr;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

/**
 * Returns current time formatted in official Thai style (e.g. "09.30 น." or "๐๙.๓๐ น.")
 */
export function getCurrentThaiTime(useThaiNumerals = false, roundToNearest5 = true): string {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();

  if (roundToNearest5) {
    minutes = Math.round(minutes / 5) * 5;
    if (minutes >= 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    }
  }

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const timeFormatted = `${hStr}.${mStr} น.`;

  return useThaiNumerals ? toThaiNumerals(timeFormatted) : timeFormatted;
}

/**
 * Returns current exact time (e.g. "09.32 น.") without rounding
 */
export function getCurrentExactThaiTime(useThaiNumerals = false): string {
  return getCurrentThaiTime(useThaiNumerals, false);
}

/**
 * Returns a live full Thai clock string for headers (e.g. "๑๔:๓๐:๑๕ น.")
 */
export function formatLiveThaiClock(dateObj: Date = new Date(), useThaiNumerals = false, includeSeconds = true): string {
  const h = String(dateObj.getHours()).padStart(2, '0');
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  const s = String(dateObj.getSeconds()).padStart(2, '0');

  const timePart = includeSeconds ? `${h}:${m}:${s} น.` : `${h}:${m} น.`;
  return useThaiNumerals ? toThaiNumerals(timePart) : timePart;
}

/**
 * Returns formatted status timestamp for the official table footer (e.g. "๒๐ ตุลาคม ๒๕๖๙ เวลา ๑๖.๓๐ น.")
 */
export function formatDocumentStatusTimestamp(
  dateStr?: string,
  useThaiNumerals = true,
  customStatus?: string,
  liveDateObj?: Date
): string {
  if (customStatus && customStatus.trim()) {
    return useThaiNumerals ? toThaiNumerals(customStatus) : toArabicNumerals(customStatus);
  }

  const targetDate = dateStr || getTodayString();
  const [yearStr, monthStr, dayStr] = targetDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const buddhistYear = year + 543;
  const monthName = THAI_MONTHS_FULL[month] ?? '';

  const now = liveDateObj || new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeFormatted = `${hours}.${minutes} น.`;

  if (useThaiNumerals) {
    const thaiDay = toThaiNumerals(day);
    const thaiYear = toThaiNumerals(buddhistYear);
    const thaiTime = toThaiNumerals(timeFormatted);
    return `${thaiDay} ${monthName} ${thaiYear} เวลา ${thaiTime}`;
  } else {
    return `${day} ${monthName} ${buddhistYear} เวลา ${timeFormatted}`;
  }
}

