import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalStorageService } from './localstorage.service';

export interface IBreakdown {
  regularHours: number;
  holidayHours: number;
  regularPay: number;
  holidayPay: number;
  nightHours: number;
  nightPay: number;
}

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
  private readonly localStorageService = new LocalStorageService();

  private baseHourlyRate = new BehaviorSubject<number>(5.52);
  private holidayMultiplier = new BehaviorSubject<number>(1.75);
  private nightMultiplier = new BehaviorSubject<number>(1.25);
  private baseTaxRate = new BehaviorSubject<number>(13.81);
  private currentMonth = new BehaviorSubject<Date>(new Date());
  private monthData = new BehaviorSubject<MonthData>({});

  // Fixed holidays (month, day) - adjust based on your country
  private fixedHolidays: HolidayDate[] = [
    { month: 0, day: 1, name: "New Year's Day" }, // Ιανουάριος (0)
    { month: 0, day: 6, name: 'Epiphany' }, // Θεοφάνεια - Ιανουάριος (0)
    { month: 2, day: 25, name: 'Independence Day' }, // 25η Μαρτίου - Μάρτιος (2)
    { month: 4, day: 1, name: 'Labor Day' }, // Πρωτομαγιά - Μάιος (4)
    { month: 7, day: 15, name: 'Assumption of Mary' }, // Δεκαπενταύγουστος - Αύγουστος (7)
    { month: 9, day: 28, name: 'Ohi Day' }, // 28η Οκτωβρίου - Οκτώβριος (9)
    { month: 11, day: 25, name: 'Christmas Day' }, // Χριστούγεννα - Δεκέμβριος (11)
    { month: 11, day: 26, name: 'Synaxis of the Mother of God' }, // Επόμενη Χριστουγέννων - Δεκέμβριος (11)
  ];

  baseHourlyRate$ = this.baseHourlyRate.asObservable();
  holidayMultiplier$ = this.holidayMultiplier.asObservable();
  nightMultiplier$ = this.nightMultiplier.asObservable();
  baseTaxRate$ = this.baseTaxRate.asObservable();
  currentMonth$ = this.currentMonth.asObservable();
  monthData$ = this.monthData.asObservable();

  constructor() {
    if (
      !this.localStorageService.exists(
        this.serializeDate(this.currentMonth.value),
      )
    ) {
      this.initializeMonth();
    }

    this.currentMonth$.subscribe((deserializedDate) => {
      const date = this.serializeDate(deserializedDate);
      const data = this.localStorageService.getItem<MonthData>(date);
      if (data && Object.keys(data).length > 0) {
        this.monthData.next(data);
      } else {
        this.initializeMonth();
      }
    });

    this.initValuesFromLocalStorage();

    this.baseHourlyRate$.subscribe((rate) => {
      this.localStorageService.setItem('baseHourlyRate', rate);
    });

    this.holidayMultiplier$.subscribe((multiplier) => {
      this.localStorageService.setItem('holidayMultiplier', multiplier);
    });

    this.nightMultiplier$.subscribe((multiplier) => {
      this.localStorageService.setItem('nightMultiplier', multiplier);
    });

    this.baseTaxRate$.subscribe((taxRate) => {
      this.localStorageService.setItem('baseTaxRate', taxRate);
    });

    this.monthData$.subscribe((data) => {
      const hasIntervals = Object.keys(data).some((key) => {
        const dayData = data[key];
        if (dayData.intervals.length > 0) {
          return true;
        }
        return false;
      });
      if (hasIntervals) {
        this.localStorageService.setItem(
          this.serializeDate(this.currentMonth.value),
          data,
        );
      } else {
        this.localStorageService.removeItem(
          this.serializeDate(this.currentMonth.value),
        );
      }
    });
  }

  initValuesFromLocalStorage(): void {
    const baseRate = this.localStorageService.getItem<number>('baseHourlyRate');
    if (baseRate) {
      this.baseHourlyRate.next(baseRate);
    }
    const holidayMultiplier =
      this.localStorageService.getItem<number>('holidayMultiplier');
    if (holidayMultiplier) {
      this.holidayMultiplier.next(holidayMultiplier);
    }
    const nightMultiplier =
      this.localStorageService.getItem<number>('nightMultiplier');
    if (nightMultiplier) {
      this.nightMultiplier.next(nightMultiplier);
    }
    const baseTaxRate = this.localStorageService.getItem<number>('baseTaxRate');
    if (baseTaxRate) {
      this.baseTaxRate.next(baseTaxRate);
    }
  }

  serializeDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  deserializeDate(date: string): Date {
    return new Date(date);
  }

  setBaseHourlyRate(rate: number): void {
    this.baseHourlyRate.next(rate);
  }

  setHolidayMultiplier(multiplier: number): void {
    this.holidayMultiplier.next(multiplier);
  }
  setNightMultiplier(multiplier: number): void {
    this.nightMultiplier.next(multiplier);
  }

  setBaseTaxRate(taxRate: number): void {
    this.baseTaxRate.next(taxRate);
  }

  setCurrentMonth(date: Date): void {
    this.currentMonth.next(date);
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
    const holidayMul = this.holidayMultiplier.value - 1;
    const nightMul = this.nightMultiplier.value - 1;

    let total = 0;
    Object.values(this.monthData.value).forEach((dayData) => {
      const nightHours = this.getNightHours(dayData.intervals);
      const regularHours = dayData.hours;

      const basePay = regularHours * baseRate;
      const holidayPay = dayData.isHoliday ? basePay * holidayMul : 0;
      const nightPay = nightHours * baseRate * nightMul;
      total += basePay + holidayPay + nightPay;
    });

    return total;
  }

  getMonthlyBreakdown(): IBreakdown {
    const baseRate = this.baseHourlyRate.value;
    const holidayMul = this.holidayMultiplier.value - 1;
    const nightMul = this.nightMultiplier.value - 1;

    let totalHours = 0;
    let holidayHours = 0;
    let nightHours = 0;

    Object.values(this.monthData.value).forEach((dayData) => {
      if (dayData.isHoliday) {
        holidayHours += dayData.hours;
      }

      totalHours += dayData.hours;
      nightHours += this.getNightHours(dayData.intervals);
      // regularHours += Math.max(dayData.hours - nightHours - holidayHours, 0);
    });

    return {
      regularHours: totalHours,
      holidayHours,
      nightHours,
      regularPay: totalHours * baseRate,
      holidayPay: holidayHours * baseRate * holidayMul,
      nightPay: nightHours * baseRate * nightMul,
    };
  }

  clearAllData(): void {
    this.initializeMonth();
  }

  apply5to9Shift(): void {
    const data: MonthData = { ...this.monthData.value };
    // this.initializeMonth();

    Object.keys(data).forEach((day) => {
      const dayData = data[day];
      const Day = dayData.date.getDay();
      if (Day >= 1 && Day <= 5) {
        dayData.intervals = [{ start: 9, end: 17 }];
        dayData.hours = 8;
      }
    });
    this.monthData.next(data);
  }

  private clampHour(value: number): number {
    return Math.min(Math.max(isNaN(Number(value)) ? 0 : Number(value), 0), 24);
  }
}
