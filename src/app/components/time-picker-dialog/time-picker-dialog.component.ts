import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { SettingsService } from '../../services/settings.service';

export interface TimePickerDialogData {
  selectedHour?: number; // 0 to 23
  selectedMinute?: number; // 0 or 30
  otherHour?: number; // 0 to 23
}

@Component({
  selector: 'app-time-picker-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './time-picker-dialog.component.html',
  styleUrls: ['./time-picker-dialog.component.scss'],
})
export class TimePickerDialogComponent implements OnInit {
  hours: number[] = Array.from({ length: 25 }, (_, i) => i);
  minutes: number[] = [0, 30];

  currentHour: number = 9; // Default fallback
  currentMinute: number = 0; // Default fallback
  is12HourFormat: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<TimePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TimePickerDialogData,
    private settingsService: SettingsService,
  ) {}

  ngOnInit(): void {
    // 1. Load pre-selected data if available
    if (!!this.data) {
      if (this.data.selectedHour !== undefined)
        this.currentHour = this.data.selectedHour;
      if (this.data.selectedMinute !== undefined)
        this.currentMinute = this.data.selectedMinute;
    }

    // 2. Assume settingsService exposes a boolean observable or value for 12h vs 24h format
    // e.g., 'hh:mm a' vs 'HH:mm'
    this.is12HourFormat = this.settingsService.getHourFormat() === '12';
  }

  selectHour(hour: number): void {
    this.currentHour = hour;
  }

  selectMinute(minute: number): void {
    this.currentMinute = minute;
  }

  isNightShift(hour: number): boolean {
    // Night shift: 0 to 6 AM (0-6) AND 10 PM to 12 AM (22-23)
    return (hour >= 0 && hour <= 6) || (hour >= 22 && hour <= 24);
  }

  formatHourLabel(hour: number): string {
    if (!this.is12HourFormat) {
      return `${hour.toString().padStart(2, '0')}:${this.currentMinute.toString().padEnd(2, '0')}`;
    }

    // 12-hour format converting logic
    const period = hour < 12 || hour === 24 ? 'πμ' : 'μμ'; // Greek for PM/AM
    let displayHour = hour % 12;
    displayHour = displayHour;
    return `${displayHour.toString().padStart(2, '0')}:${this.currentMinute.toString().padEnd(2, '0')} ${period}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      hour: this.currentHour,
      minute: this.currentMinute,
    });
  }
}
