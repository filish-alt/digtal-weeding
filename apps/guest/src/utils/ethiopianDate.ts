/**
 * Ethiopian Calendar Conversion and Formatting Utility
 * Converts Gregorian Dates to Ethiopian Calendar (Ethiopic) and provides side-by-side formatting.
 */

export interface EthiopianDateObj {
  year: number;
  month: number;
  day: number;
  monthNameAm: string;
  monthNameEn: string;
  weekdayAm: string;
  weekdayEn: string;
}

export interface SideBySideDates {
  isValid: boolean;
  ethiopianFull: string;
  ethiopianShort: string;
  gregorianFull: string;
  gregorianShort: string;
  timeFormatted: string;
  ethiopianYear: number;
  ethiopianMonthName: string;
  ethiopianDay: number;
}

export const ETHIOPIC_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
];

export const ETHIOPIC_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
];

export const WEEKDAYS_AM = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Converts a Gregorian date into Ethiopian Calendar date components.
 */
export function gregorianToEthiopian(dateInput: Date | string): EthiopianDateObj {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return {
      year: 2018,
      month: 1,
      day: 1,
      monthNameAm: ETHIOPIC_MONTHS_AM[0],
      monthNameEn: ETHIOPIC_MONTHS_EN[0],
      weekdayAm: WEEKDAYS_AM[0],
      weekdayEn: WEEKDAYS_EN[0],
    };
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Julian Day Number algorithm for Gregorian date
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Ethiopian epoch JDN offset
  const jdnOffset = 1723856;
  const r = (jdn - jdnOffset) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear = 4 * Math.floor((jdn - jdnOffset) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const monthIdx = Math.min(Math.max(ethMonth - 1, 0), 12);

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameAm: ETHIOPIC_MONTHS_AM[monthIdx] || 'መስከረም',
    monthNameEn: ETHIOPIC_MONTHS_EN[monthIdx] || 'Meskerem',
    weekdayAm: WEEKDAYS_AM[dayOfWeek] || '',
    weekdayEn: WEEKDAYS_EN[dayOfWeek] || '',
  };
}

/**
 * Formats a date into comprehensive side-by-side Ethiopian & Gregorian strings.
 */
export function formatSideBySideDates(
  dateInput?: Date | string | null,
  lang: 'am' | 'en' = 'am'
): SideBySideDates {
  if (!dateInput) {
    return {
      isValid: false,
      ethiopianFull: 'ቀን አልተገለጸም',
      ethiopianShort: 'TBD',
      gregorianFull: 'Date TBD',
      gregorianShort: 'TBD',
      timeFormatted: '',
      ethiopianYear: 2018,
      ethiopianMonthName: '',
      ethiopianDay: 1,
    };
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return {
      isValid: false,
      ethiopianFull: 'ቀን አልተገለጸም',
      ethiopianShort: 'TBD',
      gregorianFull: 'Date TBD',
      gregorianShort: 'TBD',
      timeFormatted: '',
      ethiopianYear: 2018,
      ethiopianMonthName: '',
      ethiopianDay: 1,
    };
  }

  const eth = gregorianToEthiopian(d);

  // Ethiopian formatted strings
  const ethiopianFull = `${eth.weekdayAm}፣ ${eth.monthNameAm} ${eth.day} ቀን ${eth.year} ዓ.ም.`;
  const ethiopianShort = `${eth.monthNameAm} ${eth.day}፣ ${eth.year} ዓ.ም.`;

  // Gregorian formatted strings
  const gregorianFull =
    lang === 'am'
      ? `${eth.weekdayAm}፣ ${d.toLocaleDateString('am-ET', { month: 'long', day: 'numeric', year: 'numeric' })} (እ.ኤ.አ)`
      : d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) + ' G.C.';

  const gregorianShort = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Time format
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const timeFormatted =
    lang === 'am'
      ? `${hours >= 12 ? 'ከቀኑ' : 'ከጠዋቱ'} ${d.toLocaleTimeString('am-ET', { hour: '2-digit', minute: '2-digit' })}`
      : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return {
    isValid: true,
    ethiopianFull,
    ethiopianShort,
    gregorianFull,
    gregorianShort,
    timeFormatted,
    ethiopianYear: eth.year,
    ethiopianMonthName: eth.monthNameAm,
    ethiopianDay: eth.day,
  };
}
