import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import {
  DayData,
  MonthData,
  PayrollService,
} from '../../services/payroll.service';
import { CalendarDayModalComponent } from './calendar-day-modal.component';
@Component({
  selector: 'app-calendar',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltip,
    DragDropModule,
  ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  currentMonth: Date = new Date();

  daysArray: DayData[] = [];
  monthData: MonthData = {};
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private payrollService: PayrollService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.payrollService.currentMonth$.subscribe((month) => {
      this.currentMonth = month;
      this.buildDaysArray();
    });

    this.payrollService.monthData$.subscribe((data) => {
      this.monthData = data;
      this.buildDaysArray();
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
        intervals: [],
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
        intervals: [],
      };
      this.daysArray.push(dayData);
    }
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

  private isHolidayDate(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0; // Sunday
  }

  toggleHoliday(date: Date): void {
    this.payrollService.toggleHoliday(date);
  }

  onCellClick(dayData: DayData, event: Event): void {
    event.stopPropagation();
    this.openEditDialog(dayData);
  }

  openEditDialog(dayData: DayData): void {
    const dialogRef = this.dialog.open(CalendarDayModalComponent, {
      // width: '360px',
      data: {
        date: dayData.date,
        intervals: dayData.intervals ?? [],
        isHoliday: dayData.isHoliday,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.payrollService.setDayIntervals(dayData.date, result.intervals);
        this.payrollService.setDayHoliday(dayData.date, result.isHoliday);
      }
    });
  }

  isDayInCurrentMonth(date: Date): boolean {
    return (
      date.getMonth() === this.currentMonth.getMonth() &&
      date.getFullYear() === this.currentMonth.getFullYear()
    );
  }

  clearAllValues(): void {
    if (confirm('Are you sure you want to clear all calendar values?')) {
      this.payrollService.clearAllData();
    }
  }
}
