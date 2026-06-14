import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DayData {
  date: Date;
  hours: number;
  isHoliday: boolean;
  startTimeHours: number;
  endTimeHours: number;
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
    const startTimeHours = data[key]?.startTimeHours ?? 0;
    const endTimeHours = startTimeHours + Math.max(0, hours);
    if (!data[key]) {
      data[key] = {
        date,
        hours,
        isHoliday: this.isHolidayDate(date),
        startTimeHours,
        endTimeHours,
      };
    } else {
      data[key] = {
        ...data[key],
        hours,
        startTimeHours,
        endTimeHours,
      };
    }
    this.monthData.next(data);
  }

  setDayRange(date: Date, startTimeHours: number, endTimeHours: number): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    const validatedStart = Math.max(0, Math.min(36, Number(startTimeHours)));
    const validatedEnd = Math.max(
      validatedStart,
      Math.min(36, Number(endTimeHours)),
    );
    const hours = Number((validatedEnd - validatedStart).toFixed(2));

    if (!data[key]) {
      data[key] = {
        date,
        hours,
        isHoliday: this.isHolidayDate(date),
        startTimeHours: validatedStart,
        endTimeHours: validatedEnd,
      };
    } else {
      data[key] = {
        ...data[key],
        hours,
        startTimeHours: validatedStart,
        endTimeHours: validatedEnd,
      };
    }
    this.monthData.next(data);
  }

  toggleHoliday(date: Date): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    if (!data[key]) {
      data[key] = {
        date,
        hours: 0,
        isHoliday: true,
        startTimeHours: 0,
        endTimeHours: 0,
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
        startTimeHours: 0,
        endTimeHours: 0,
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
        startTimeHours: 0,
        endTimeHours: 0,
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

  private getNightHours(startTimeHours: number, endTimeHours: number): number {
    const start = Math.max(0, Math.min(36, startTimeHours));
    const end = Math.max(0, Math.min(36, endTimeHours));
    if (end <= start) {
      return 0;
    }

    const nightWindows: Array<[number, number]> = [
      [0, 6],
      [22, 30],
    ];

    return nightWindows.reduce((total, [windowStart, windowEnd]) => {
      const overlapStart = Math.max(start, windowStart);
      const overlapEnd = Math.min(end, windowEnd);
      return total + Math.max(0, overlapEnd - overlapStart);
    }, 0);
  }

  calculateMonthlyIncome(): number {
    const baseRate = this.baseHourlyRate.value;
    const multiplier = this.holidayMultiplier.value;
    const nightBonus = 0.25;

    let total = 0;
    Object.values(this.monthData.value).forEach((dayData) => {
      const basePay = dayData.hours * baseRate;
      const holidayPay = dayData.isHoliday ? basePay * (multiplier - 1) : 0;
      const nightHours = this.getNightHours(
        dayData.startTimeHours,
        dayData.endTimeHours,
      );
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
      nightHours += this.getNightHours(
        dayData.startTimeHours,
        dayData.endTimeHours,
      );
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
}
