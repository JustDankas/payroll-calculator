import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

export interface DayModalData {
  date: Date;
  hours: number;
  startTimeHours?: number;
  endTimeHours?: number;
  isHoliday: boolean;
}

@Component({
  selector: 'app-calendar-day-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSliderModule,
  ],
  templateUrl: './calendar-day-modal.component.html',
  styleUrls: ['./calendar-day-modal.component.scss'],
})
export class CalendarDayModalComponent implements AfterViewInit {
  @ViewChild('sliderTrack') sliderTrack!: ElementRef<HTMLDivElement>;
  @ViewChild('workedHours') workedHours!: ElementRef<HTMLDivElement>;
  @ViewChild('sliderStart') sliderStart!: ElementRef<HTMLDivElement>;
  @ViewChild('sliderEnd') sliderEnd!: ElementRef<HTMLDivElement>;
  @ViewChild('inputSliderStart')
  inputSliderStart!: ElementRef<HTMLInputElement>;
  @ViewChild('inputSliderEnd') inputSliderEnd!: ElementRef<HTMLInputElement>;

  sliderKey = 'hours';
  date: Date;
  isHoliday: boolean;
  startTimeHours: number;
  endTimeHours: number;
  readonly MAX_SHIFT_HOURS = 36;

  constructor(
    public dialogRef: MatDialogRef<CalendarDayModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DayModalData,
  ) {
    this.date = data.date;
    this.isHoliday = !!data.isHoliday;
    this.startTimeHours = data.startTimeHours ?? 0;
    this.endTimeHours = data.endTimeHours ?? 0;

    if (this.endTimeHours < this.startTimeHours) {
      this.endTimeHours = this.startTimeHours;
    }

    if (this.endTimeHours === 0 && data.hours) {
      this.endTimeHours = Math.min(
        this.MAX_SHIFT_HOURS,
        this.startTimeHours + data.hours,
      );
    }
  }
  ngAfterViewInit(): void {
    this.fillColor();
    this.inputZIndex();
  }

  getWorkedHours(): number {
    return Number(
      Math.max(0, this.endTimeHours - this.startTimeHours).toFixed(2),
    );
  }

  onStartChange(): void {
    this.startTimeHours = Number(this.startTimeHours);
    if (isNaN(this.startTimeHours)) this.startTimeHours = 0;
    if (this.startTimeHours < 0) this.startTimeHours = 0;
    if (this.startTimeHours > this.MAX_SHIFT_HOURS)
      this.startTimeHours = this.MAX_SHIFT_HOURS;
    if (this.startTimeHours > this.endTimeHours)
      this.startTimeHours = this.endTimeHours;
  }

  onEndChange(): void {
    this.endTimeHours = Number(this.endTimeHours);
    if (isNaN(this.endTimeHours)) this.endTimeHours = this.startTimeHours;
    if (this.endTimeHours < 0) this.endTimeHours = 0;
    if (this.endTimeHours > this.MAX_SHIFT_HOURS)
      this.endTimeHours = this.MAX_SHIFT_HOURS;
    if (this.endTimeHours < this.startTimeHours)
      this.endTimeHours = this.startTimeHours;
  }

  getRangeBackground(): string {
    const startPct = (this.startTimeHours / this.MAX_SHIFT_HOURS) * 100;
    const endPct = (this.endTimeHours / this.MAX_SHIFT_HOURS) * 100;
    return `linear-gradient(to right, #e6e8ef 0% ${startPct}%, rgba(63,81,181,0.95) ${startPct}% ${endPct}%, #e6e8ef ${endPct}% 100%)`;
  }

  formatShiftTime(value: number): string {
    const totalMinutes = Math.round(value * 60);
    const isNextDay = totalMinutes >= 1440;
    const minutesInDay = totalMinutes % 1440;
    const hours = Math.floor(minutesInDay / 60);
    const minutes = minutesInDay % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${displayHour}:${paddedMinutes} ${period}${isNextDay ? ' next day' : ''}`;
  }

  save() {
    this.dialogRef.close({
      startTimeHours: Number(this.startTimeHours),
      endTimeHours: Number(this.endTimeHours),
      isHoliday: !!this.isHoliday,
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  valueChanged() {
    this.fillColor();
    this.inputZIndex();
    this.inputOverlap();
    this.syncDomSliders();
  }

  fillColor() {
    let minInputValue: number;
    let maxInputValue: number;

    let totalLimit = Math.abs(0) + Math.abs(this.MAX_SHIFT_HOURS);

    if (this.startTimeHours < 0) {
      minInputValue = Math.abs(0) - Math.abs(this.startTimeHours);
    } else {
      minInputValue = Math.abs(0) + this.startTimeHours;
    }

    if (this.endTimeHours >= 0) {
      maxInputValue = Math.abs(0) + this.endTimeHours;
    } else {
      maxInputValue = Math.abs(0) - Math.abs(this.endTimeHours);
    }
    if (this.sliderKey !== null || this.sliderKey !== undefined) {
      let percent1 = (minInputValue / totalLimit) * 100;
      let percent2 = (maxInputValue / totalLimit) * 100;
      this.sliderTrack.nativeElement.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , #3264fe ${percent1}% , #3264fe ${percent2}%, #dadae5 ${percent2}%)`;

      this.sliderStart.nativeElement.style.left = `clamp(0%, ${percent1}%, 85%)`;
      this.sliderEnd.nativeElement.style.left = `clamp(0%, ${percent2}%, 85%)`;
      // 1. Calculate the exact midpoint percentage
      let midPointPercent = (percent1 + percent2) / 2;
      // We use translate(-50%) in CSS to perfectly center the text element on that midpoint
      // this.workedHours.nativeElement.style.left = `clamp(0%, ${midPointPercent}%, 100%)`;
    }
  }
  inputZIndex() {
    // When overlapping, adjust z-index to ensure the correct slider is on top
    if (this.inputSliderEnd && this.endTimeHours == this.MAX_SHIFT_HOURS) {
      this.inputSliderStart.nativeElement.style.zIndex = '100';
      this.inputSliderEnd.nativeElement.style.zIndex = '1';
    } else {
      this.inputSliderStart.nativeElement.style.zIndex = '1';
      this.inputSliderEnd.nativeElement.style.zIndex = '100';
    }
  }
  inputOverlap() {
    // Ensure values are parsed as numbers to prevent string concatenation bugs
    const start = Number(this.startTimeHours);
    const end = Number(this.endTimeHours);

    if (start > end) {
      this.startTimeHours = end;
    }
    if (end < start) {
      this.endTimeHours = start;
    }
  }

  syncDomSliders() {
    // Force the physical DOM inputs to match our clamped TypeScript properties
    if (
      this.inputSliderStart?.nativeElement &&
      this.inputSliderEnd?.nativeElement
    ) {
      this.inputSliderStart.nativeElement.value =
        this.startTimeHours.toString();
      this.inputSliderEnd.nativeElement.value = this.endTimeHours.toString();
    }
  }
}
