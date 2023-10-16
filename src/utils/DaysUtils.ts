export interface Day {
  bit: number;
  dayShort: string;
  dayLong: string;
  jsDay: number;
  day: number;
}

const mon: Day = {
  bit: 1,
  dayShort: 'Mon',
  dayLong: 'Monday',
  jsDay: 1,
  day: 0
};
const tue: Day = {
  bit: 2,
  dayShort: 'Tue',
  dayLong: 'Tuesday',
  jsDay: 2,
  day: 1
};
const wed: Day = {
  bit: 4,
  dayShort: 'Wed',
  dayLong: 'Wednesday',
  jsDay: 3,
  day: 2
};
const thu: Day = {
  bit: 8,
  dayShort: 'Thu',
  dayLong: 'Thursday',
  jsDay: 4,
  day: 3
};
const fri: Day = {
  bit: 16,
  dayShort: 'Fri',
  dayLong: 'Friday',
  jsDay: 5,
  day: 4
};
const sat: Day = {
  bit: 32,
  dayShort: 'Sat',
  dayLong: 'Saturday',
  jsDay: 6,
  day: 5
};
const sun: Day = {
  bit: 64,
  dayShort: 'Sun',
  dayLong: 'Sunday',
  jsDay: 0,
  day: 6
};
export const DaysOfWeekByJsDay = new Map<number, Day>();
DaysOfWeekByJsDay.set(0, sun);
DaysOfWeekByJsDay.set(1, mon);
DaysOfWeekByJsDay.set(2, tue);
DaysOfWeekByJsDay.set(3, wed);
DaysOfWeekByJsDay.set(4, thu);
DaysOfWeekByJsDay.set(5, fri);
DaysOfWeekByJsDay.set(6, sat);
export const DaysOfWeek = new Map<number, Day>();
DaysOfWeek.set(0, mon);
DaysOfWeek.set(1, tue);
DaysOfWeek.set(2, wed);
DaysOfWeek.set(3, thu);
DaysOfWeek.set(4, fri);
DaysOfWeek.set(5, sat);
DaysOfWeek.set(6, sun);
