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
import { PayrollService } from '../../services/payroll.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { GuideComponent } from '../guide/guide.component';

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
    CalendarComponent,
    GuideComponent,
  ],
  templateUrl: './payroll-calculator.component.html',
  styleUrl: './payroll-calculator.component.scss',
})
export class PayrollCalculatorComponent implements OnInit {
  baseHourlyRate: number = 5.52;
  holidayMultiplier: number = 1.75;
  baseTaxRate: number = 13.87; // 13.87% tax rate

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

    this.payrollService.monthData$.subscribe((data) => {
      this.updateIncome();
    });
  }

  private updateIncome(): void {
    this.monthlyIncome = this.payrollService.calculateMonthlyIncome();
    this.breakdown = this.payrollService.getMonthlyBreakdown();
  }

  onBaseRateChange(): void {
    this.payrollService.setBaseHourlyRate(this.baseHourlyRate);
  }

  onTaxRateChange(): void {
    this.payrollService.setBaseTaxRate(this.baseTaxRate);
  }

  onMultiplierChange(): void {
    this.payrollService.setHolidayMultiplier(this.holidayMultiplier);
  }

  clearHours(date: Date): void {
    this.payrollService.setDayHours(date, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }
}
