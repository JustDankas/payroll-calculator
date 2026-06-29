import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DayInterval {
  start: number;
  end: number;
}

export interface DayData {
  date: Date;
  hours: number;
  isHoliday: boolean;
  intervals: DayInterval[];
}

export interface MonthData {
  [key: string]: DayData;
}

export interface HolidayDate {
  month: number;
  day: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class PayrollService {
  private baseHourlyRate = new BehaviorSubject<number>(5.64);
  private holidayMultiplier = new BehaviorSubject<number>(1.75);
  private baseTaxRate = new BehaviorSubject<number>(13.81);
  private currentMonth = new BehaviorSubject<Date>(new Date());
  private monthData = new BehaviorSubject<MonthData>({});

  // Fixed holidays (month, day) - adjust based on your country
  private fixedHolidays: HolidayDate[] = [
    { month: 0, day: 1, name: "New Year's Day" },
    { month: 11, day: 25, name: 'Christmas' },
    { month: 4, day: 1, name: 'Labor Day' },
  ];

  baseHourlyRate$ = this.baseHourlyRate.asObservable();
  holidayMultiplier$ = this.holidayMultiplier.asObservable();
  baseTaxRate$ = this.baseTaxRate.asObservable();
  currentMonth$ = this.currentMonth.asObservable();
  monthData$ = this.monthData.asObservable();

  constructor() {
    this.initializeMonth();
  }

  setBaseHourlyRate(rate: number): void {
    this.baseHourlyRate.next(rate);
  }

  setHolidayMultiplier(multiplier: number): void {
    this.holidayMultiplier.next(multiplier);
  }

  setBaseTaxRate(taxRate: number): void {
    this.baseTaxRate.next(taxRate);
  }

  setCurrentMonth(date: Date): void {
    this.currentMonth.next(date);
    this.initializeMonth();
  }

  goToNextMonth(): void {
    const next = new Date(this.currentMonth.value);
    next.setMonth(next.getMonth() + 1);
    this.setCurrentMonth(next);
  }

  goToPreviousMonth(): void {
    const prev = new Date(this.currentMonth.value);
    prev.setMonth(prev.getMonth() - 1);
    this.setCurrentMonth(prev);
  }

  setDayHours(date: Date, hours: number): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    const validatedHours = Math.max(0, hours);

    if (!data[key]) {
      data[key] = {
        date,
        hours: validatedHours,
        isHoliday: this.isHolidayDate(date),
        intervals: [],
      };
    } else {
      data[key] = {
        ...data[key],
        hours: validatedHours,
        intervals: [],
      };
    }

    this.monthData.next(data);
  }

  setDayIntervals(date: Date, intervals: DayInterval[]): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };

    const validatedIntervals = intervals
      .map((interval) => ({
        start: this.clampHour(interval.start),
        end: this.clampHour(interval.end),
      }))
      .filter((interval) => interval.end > interval.start)
      .sort((a, b) => a.start - b.start);

    const hours = Number(
      validatedIntervals
        .reduce((sum, interval) => sum + interval.end - interval.start, 0)
        .toFixed(2),
    );

    if (!data[key]) {
      data[key] = {
        date,
        hours,
        isHoliday: this.isHolidayDate(date),
        intervals: validatedIntervals,
      };
    } else {
      data[key] = {
        ...data[key],
        hours,
        intervals: validatedIntervals,
      };
    }

    this.monthData.next(data);
  }

  setDayRange(date: Date, startTimeHours: number, endTimeHours: number): void {
    this.setDayIntervals(date, [
      {
        start: this.clampHour(Number(startTimeHours)),
        end: this.clampHour(Number(endTimeHours)),
      },
    ]);
  }

  toggleHoliday(date: Date): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    if (!data[key]) {
      data[key] = {
        date,
        hours: 0,
        isHoliday: true,
        intervals: [],
      };
    } else {
      data[key] = {
        ...data[key],
        isHoliday: !data[key].isHoliday,
      };
    }
    this.monthData.next(data);
  }

  setDayHoliday(date: Date, isHoliday: boolean): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    if (!data[key]) {
      data[key] = {
        date,
        hours: 0,
        isHoliday,
        intervals: [],
      };
    } else {
      data[key] = {
        ...data[key],
        isHoliday,
      };
    }
    this.monthData.next(data);
  }

  getDayData(date: Date): DayData | null {
    const key = this.getDateKey(date);
    return this.monthData.value[key] || null;
  }

  private initializeMonth(): void {
    const data: MonthData = {};
    const year = this.currentMonth.value.getFullYear();
    const month = this.currentMonth.value.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = this.getDateKey(date);
      data[key] = {
        date,
        hours: 0,
        isHoliday: this.isHolidayDate(date),
        intervals: [],
      };
    }

    this.monthData.next(data);
  }

  private isHolidayDate(date: Date): boolean {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) return true; // Sunday

    const month = date.getMonth();
    const day = date.getDate();

    return this.fixedHolidays.some((h) => h.month === month && h.day === day);
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private getNightOverlap(start: number, end: number): number {
    const nightWindows: Array<[number, number]> = [
      [0, 6],
      [22, 24],
    ];

    return nightWindows.reduce((total, [windowStart, windowEnd]) => {
      const overlapStart = Math.max(start, windowStart);
      const overlapEnd = Math.min(end, windowEnd);
      return total + Math.max(0, overlapEnd - overlapStart);
    }, 0);
  }

  private getNightHours(intervals: DayInterval[]): number {
    return intervals.reduce(
      (total, interval) =>
        total + this.getNightOverlap(interval.start, interval.end),
      0,
    );
  }

  calculateMonthlyIncome(): number {
    const baseRate = this.baseHourlyRate.value;
    const multiplier = this.holidayMultiplier.value;
    const nightBonus = 0.25;

    let total = 0;
    Object.values(this.monthData.value).forEach((dayData) => {
      const basePay = dayData.hours * baseRate;
      const holidayPay = dayData.isHoliday ? basePay * (multiplier - 1) : 0;
      const nightHours = this.getNightHours(dayData.intervals);
      const nightPay = nightHours * baseRate * nightBonus;
      total += basePay + holidayPay + nightPay;
    });

    return total;
  }

  getMonthlyBreakdown(): {
    regularHours: number;
    holidayHours: number;
    nightHours: number;
    regularPay: number;
    holidayPay: number;
    nightPay: number;
  } {
    const baseRate = this.baseHourlyRate.value;
    const multiplier = this.holidayMultiplier.value;
    const nightBonus = 0.25;

    let regularHours = 0;
    let holidayHours = 0;
    let nightHours = 0;

    Object.values(this.monthData.value).forEach((dayData) => {
      if (dayData.isHoliday) {
        holidayHours += dayData.hours;
      } else {
        regularHours += dayData.hours;
      }
      nightHours += this.getNightHours(dayData.intervals);
    });

    return {
      regularHours,
      holidayHours,
      nightHours,
      regularPay: regularHours * baseRate,
      holidayPay: holidayHours * baseRate * multiplier,
      nightPay: nightHours * baseRate * nightBonus,
    };
  }

  clearAllData(): void {
    this.initializeMonth();
  }

  private clampHour(value: number): number {
    return Math.min(Math.max(isNaN(Number(value)) ? 0 : Number(value), 0), 24);
  }
}
