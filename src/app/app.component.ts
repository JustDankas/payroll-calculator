import { Component } from '@angular/core';
import { FabMenuComponent } from './components/fab-menu/fab-menu.component';
import { PayrollCalculatorComponent } from './components/payroll-calculator/payroll-calculator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PayrollCalculatorComponent, FabMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ancho-pay';
}
