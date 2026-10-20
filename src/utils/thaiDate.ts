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
