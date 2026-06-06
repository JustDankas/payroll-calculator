import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DayData {
  date: Date;
  hours: number;
  isHoliday: boolean;
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
  private baseHoursPerDay = new BehaviorSubject<number>(6.5);
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
  baseHoursPerDay$ = this.baseHoursPerDay.asObservable();
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
  setBaseHoursPerDay(hours: number): void {
    this.baseHoursPerDay.next(hours);
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
    if (!data[key]) {
      data[key] = { date, hours: 0, isHoliday: this.isHolidayDate(date) };
    }
    data[key].hours = hours;
    this.monthData.next(data);
  }

  toggleHoliday(date: Date): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    if (!data[key]) {
      data[key] = { date, hours: 0, isHoliday: true };
    } else {
      data[key].isHoliday = !data[key].isHoliday;
    }
    this.monthData.next(data);
  }

  setDayHoliday(date: Date, isHoliday: boolean): void {
    const key = this.getDateKey(date);
    const data = { ...this.monthData.value };
    if (!data[key]) {
      data[key] = { date, hours: 0, isHoliday };
    } else {
      data[key].isHoliday = isHoliday;
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

  calculateMonthlyIncome(): number {
    const baseRate = this.baseHourlyRate.value;
    const multiplier = this.holidayMultiplier.value;

    let total = 0;
    Object.values(this.monthData.value).forEach((dayData) => {
      const rate = dayData.isHoliday ? baseRate * multiplier : baseRate;
      total += dayData.hours * rate;
    });

    return total;
  }

  getMonthlyBreakdown(): {
    regularHours: number;
    holidayHours: number;
    regularPay: number;
    holidayPay: number;
  } {
    const baseRate = this.baseHourlyRate.value;
    const multiplier = this.holidayMultiplier.value;

    let regularHours = 0;
    let holidayHours = 0;

    Object.values(this.monthData.value).forEach((dayData) => {
      if (dayData.isHoliday) {
        holidayHours += dayData.hours;
      } else {
        regularHours += dayData.hours;
      }
    });

    return {
      regularHours,
      holidayHours,
      regularPay: regularHours * baseRate,
      holidayPay: holidayHours * baseRate * multiplier,
    };
  }
}
