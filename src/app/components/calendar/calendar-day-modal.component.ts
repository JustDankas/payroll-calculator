import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DayModalData {
  date: Date;
  hours: number;
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
  ],
  templateUrl: './calendar-day-modal.component.html',
  styleUrls: ['./calendar-day-modal.component.scss'],
})
export class CalendarDayModalComponent {
  hours: number;
  isHoliday: boolean;
  date: Date;

  constructor(
    public dialogRef: MatDialogRef<CalendarDayModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DayModalData,
  ) {
    this.date = data.date;
    this.hours = data.hours ?? 0;
    this.isHoliday = !!data.isHoliday;
  }

  save() {
    this.dialogRef.close({
      hours: Number(this.hours),
      isHoliday: !!this.isHoliday,
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
