interface Holiday {
  name: string;
  date: Date;
  isFixed: boolean; // Whether the date is fixed or calculated (e.g., Easter)
}

export function getGhanaHolidays(year: number = new Date().getFullYear()): Holiday[] {
  // Fixed date holidays
  const fixedHolidays: Omit<Holiday, 'date'>[] = [
    { name: "New Year's Day", isFixed: true },
    { name: "Constitution Day", isFixed: true },
    { name: "Independence Day", isFixed: true },
    { name: "May Day (Workers' Day)", isFixed: true },
    { name: "African Union Day", isFixed: true },
    { name: "Republic Day", isFixed: true },
    { name: "Kwame Nkrumah Memorial Day", isFixed: true },
    { name: "Founders' Day", isFixed: true },
    { name: "Farmer's Day", isFixed: false }, // First Friday of December
    { name: "Christmas Day", isFixed: true },
    { name: "Boxing Day", isFixed: true }
  ];

  // Calculate Easter related holidays (Good Friday and Easter Monday)
  const easterDate = calculateEaster(year);
  
  const holidays: Holiday[] = [
    // Fixed date holidays
    { name: "New Year's Day", date: new Date(year, 0, 1), isFixed: true },
    { name: "Constitution Day", date: new Date(year, 0, 7), isFixed: true },
    { name: "Independence Day", date: new Date(year, 2, 6), isFixed: true }, // March 6
    { name: "May Day (Workers' Day)", date: new Date(year, 4, 1), isFixed: true },
    { name: "African Union Day", date: new Date(year, 4, 25), isFixed: true },
    { name: "Republic Day", date: new Date(year, 6, 1), isFixed: true },
    { name: "Kwame Nkrumah Memorial Day", date: new Date(year, 8, 21), isFixed: true },
    { name: "Founders' Day", date: new Date(year, 11, 1), isFixed: true },
    
    // Calculated holidays
    { name: "Good Friday", date: addDays(easterDate, -2), isFixed: false },
    { name: "Easter Monday", date: addDays(easterDate, 1), isFixed: false },
    { name: "Farmer's Day", date: getFirstFridayOfDecember(year), isFixed: false },
    
    // End of year holidays
    { name: "Christmas Day", date: new Date(year, 11, 25), isFixed: true },
    { name: "Boxing Day", date: new Date(year, 11, 26), isFixed: true },
  ];

  // Sort holidays by date
  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Helper function to calculate Easter Sunday (Western Christian)
function calculateEaster(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getFirstFridayOfDecember(year: number): Date {
  // First day of December
  const date = new Date(year, 11, 1);
  // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay();
  // Calculate days until Friday (5 = Friday)
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  // If it's already Friday, we need to add 7 days to get to the next Friday
  const daysToAdd = daysUntilFriday === 0 ? 0 : daysUntilFriday;
  date.setDate(1 + daysToAdd);
  return date;
}

export function getNextHoliday(currentDate: Date = new Date()): { holiday: Holiday; daysUntil: number } | null {
  const currentYear = currentDate.getFullYear();
  const nextYear = currentYear + 1;
  
  // Get holidays for current and next year
  const currentYearHolidays = getGhanaHolidays(currentYear);
  const nextYearHolidays = getGhanaHolidays(nextYear);
  
  // Combine and sort all holidays
  const allHolidays = [...currentYearHolidays, ...nextYearHolidays]
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Find the next holiday after current date
  for (const holiday of allHolidays) {
    // Reset hours to compare only dates
    const holidayDate = new Date(holiday.date);
    holidayDate.setHours(0, 0, 0, 0);
    
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    
    // If holiday is today or in the future
    if (holidayDate >= today) {
      const timeDiff = holidayDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        holiday: {
          ...holiday,
          date: holidayDate
        },
        daysUntil
      };
    }
  }
  
  return null;
}
