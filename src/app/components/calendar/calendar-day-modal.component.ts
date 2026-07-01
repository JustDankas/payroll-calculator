import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { SettingsService } from '../../services/settings.service';
import { TimePickerDialogComponent } from '../time-picker-dialog/time-picker-dialog.component';
export interface ITimePickerDialogResult {
  hour: number;
  minute: number;
}
export interface DayInterval {
  start: number;
  end: number;
}
export interface DayModalData {
  date: Date;
  intervals: DayInterval[];
  isHoliday: boolean;
}

@Component({
  selector: 'app-calendar-day-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatTooltip,
  ],
  templateUrl: './calendar-day-modal.component.html',
  styleUrls: ['./calendar-day-modal.component.scss'],
})
export class CalendarDayModalComponent {
  date: Date;
  isHoliday: boolean;
  intervals: DayInterval[];
  intervalError = '';
  hourFormat!: string;
  readonly hourOptions = Array.from({ length: 49 }, (_, i) => i * 0.5);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly dialog: MatDialog,
    public dialogRef: MatDialogRef<CalendarDayModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DayModalData,
  ) {
    settingsService.hourFormat$.subscribe((hourFormat) => {
      this.hourFormat = hourFormat;
    });
    this.date = data.date;
    this.isHoliday = !!data.isHoliday;
    this.intervals = (data.intervals ?? []).map((interval) => ({
      start: this.clampHour(interval.start),
      end: this.clampHour(interval.end),
    }));
    this.sortIntervals();
    this.validateIntervals();
  }

  get totalHours(): number {
    return Number(
      this.intervals
        .reduce(
          (sum, interval) => sum + Math.max(0, interval.end - interval.start),
          0,
        )
        .toFixed(2),
    );
  }

  addInterval(): void {
    this.intervals.push({ start: 0, end: 0 });
    this.validateIntervals();
  }

  removeInterval(index: number): void {
    this.intervals.splice(index, 1);
    this.validateIntervals();
  }

  updateInterval(index: number, field: 'start' | 'end', event: number): void {
    this.intervals[index][field] = this.clampHour(event);
    // this.sortIntervals();
    this.trimIntervals(index, field);
    this.validateIntervals();
  }

  private trimIntervals(index: number, field: 'start' | 'end'): void {
    if (field === 'start') {
      this.intervals[index].end = Math.max(
        this.intervals[index].end,
        this.intervals[index].start,
      );
    } else {
      this.intervals[index].start = Math.min(
        this.intervals[index].end,
        this.intervals[index].start,
      );
    }
  }

  save(): void {
    if (!this.validateIntervals()) {
      return;
    }

    this.dialogRef.close({
      intervals: this.intervals,
      isHoliday: !!this.isHoliday,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  formatTimeLabel(value: number): string {
    if (this.hourFormat === '12') {
      return this.formatTimeLabelTo12Hour(value);
    } else {
      return this.formatTimeLabelTo24Hour(value);
    }
  }

  openTimePicker(index: number, field: 'start' | 'end'): void {
    const dialogRef = this.dialog.open(TimePickerDialogComponent, {
      data: {
        selectedHour: Math.floor(this.intervals[index][field]),
        selectedMinute: (this.intervals[index][field] % 1) * 60,
      },
    });
    dialogRef.afterClosed().subscribe((result: ITimePickerDialogResult) => {
      if (!!result) {
        const hour = result.hour + result.minute / 60;
        this.intervals[index][field] = this.clampHour(hour);
        this.trimIntervals(index, field);
        this.validateIntervals();
      }
    });
  }

  private formatTimeLabelTo12Hour(value: number) {
    const hours = Math.floor(value % 12);
    const timePeriod = value < 12 ? 'πμ' : 'μμ';
    const minutes = (value % 1) * 60;
    const paddedMinutes = minutes === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${paddedMinutes} ${value == 24 ? 'πμ' : timePeriod}`;
  }

  private formatTimeLabelTo24Hour(value: number) {
    const hours = Math.floor(value);
    const minutes = (value % 1) * 60;
    const paddedMinutes = minutes === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${paddedMinutes}`;
  }

  private sortIntervals(): void {
    const sorted = [...this.intervals].sort((a, b) => a.start - b.start);
    this.intervals = sorted;
  }

  private clampHour(value: number): number {
    return Math.min(Math.max(isNaN(Number(value)) ? 0 : Number(value), 0), 24);
  }

  private validateIntervals(): boolean {
    // for (const interval of this.intervals) {
    //   if (interval.end < interval.start) {
    //     this.intervalError = 'Each interval must end after its start time.';
    //     return false;
    //   }
    // }

    const sorted = [...this.intervals].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sorted.length - 1; i += 1) {
      if (sorted[i + 1].start < sorted[i].end) {
        this.intervalError =
          'Προσοχή: Έχεις 2 ή περισσότερα διαστήματα βάρδιας που επικαλύπτονται.';
        return false;
      }
    }

    this.intervalError = '';
    return true;
  }
}
