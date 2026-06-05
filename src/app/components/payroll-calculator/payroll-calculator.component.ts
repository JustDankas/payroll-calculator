import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DayData,
  MonthData,
  PayrollService,
} from '../../services/payroll.service';

@Component({
  selector: 'app-payroll-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatGridListModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './payroll-calculator.component.html',
  styleUrl: './payroll-calculator.component.scss',
})
export class PayrollCalculatorComponent implements OnInit {
  baseHourlyRate: number = 5.64;
  holidayMultiplier: number = 1.75;
  baseHoursPerDay: number = 8;
  baseTaxRate: number = 13.81; // 13.81% tax rate

  currentMonth: Date = new Date();
  monthData: MonthData = {};
  daysArray: DayData[] = [];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthlyIncome: number = 0;
  breakdown: any = {
    regularHours: 0,
    holidayHours: 0,
    regularPay: 0,
    holidayPay: 0,
  };

  constructor(private payrollService: PayrollService) {}

  ngOnInit(): void {
    this.payrollService.baseHourlyRate$.subscribe((rate) => {
      this.baseHourlyRate = rate;
      this.updateIncome();
    });

    this.payrollService.holidayMultiplier$.subscribe((multiplier) => {
      this.holidayMultiplier = multiplier;
      this.updateIncome();
    });

    this.payrollService.currentMonth$.subscribe((month) => {
      this.currentMonth = month;
      this.buildDaysArray();
    });

    this.payrollService.monthData$.subscribe((data) => {
      this.monthData = data;
      this.buildDaysArray();
      this.updateIncome();
    });
  }

  private buildDaysArray(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();

    this.daysArray = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.daysArray.push({
        date: new Date(year, month, -i),
        hours: 0,
        isHoliday: false,
      });
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = `${year}-${month}-${day}`;
      const dayData = this.monthData[key] || {
        date,
        hours: 0,
        isHoliday: this.isHolidayDate(date),
      };
      this.daysArray.push(dayData);
    }
  }

  private isHolidayDate(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0; // Sunday
  }

  private updateIncome(): void {
    this.monthlyIncome = this.payrollService.calculateMonthlyIncome();
    this.breakdown = this.payrollService.getMonthlyBreakdown();
  }

  onBaseRateChange(): void {
    this.payrollService.setBaseHourlyRate(this.baseHourlyRate);
  }

  onBaseHoursChange(): void {
    this.payrollService.setBaseHoursPerDay(this.baseHoursPerDay);
  }

  onTaxRateChange(): void {
    this.payrollService.setBaseTaxRate(this.baseTaxRate);
  }

  onMultiplierChange(): void {
    this.payrollService.setHolidayMultiplier(this.holidayMultiplier);
  }

  onHoursChange(date: Date, hours: number): void {
    this.payrollService.setDayHours(date, hours);
  }

  toggleHoliday(date: Date): void {
    this.payrollService.toggleHoliday(date);
  }

  applyBaseHours(date: Date): void {
    this.payrollService.setDayHours(date, this.baseHoursPerDay);
  }

  clearHours(date: Date): void {
    this.payrollService.setDayHours(date, 0);
  }

  previousMonth(): void {
    this.payrollService.goToPreviousMonth();
  }

  nextMonth(): void {
    this.payrollService.goToNextMonth();
  }

  getMonthYearDisplay(): string {
    return this.currentMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  isDayInCurrentMonth(date: Date): boolean {
    return (
      date.getMonth() === this.currentMonth.getMonth() &&
      date.getFullYear() === this.currentMonth.getFullYear()
    );
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  sanitizeInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement && inputElement.value) {
      // Converts the string "04" into number 4, removing the leading zero
      const sanitizedValue = Number(inputElement.value);
      inputElement.value = sanitizedValue.toString();
    }
  }
}
