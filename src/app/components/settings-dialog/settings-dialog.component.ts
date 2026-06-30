import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings-dialog',
  imports: [MatDividerModule, MatRadioModule, FormsModule, AsyncPipe],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
})
export class SettingsDialogComponent {
  hourFormat!: string;

  constructor(private readonly settingsService: SettingsService) {
    this.settingsService.hourFormat$.subscribe(
      (hourFormat) => (this.hourFormat = hourFormat),
    );
  }

  hourSettingChanged(event: MatRadioChange): void {
    this.settingsService.setHourFormat(event.value);
  }
}
