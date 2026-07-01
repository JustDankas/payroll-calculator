import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalStorageService } from './localstorage.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private hourFormat = new BehaviorSubject<string>('12');
  hourFormat$ = this.hourFormat.asObservable();
  constructor(private readonly localStorageService: LocalStorageService) {
    const storedHourFormat = this.localStorageService.getItem<string>(
      'settings_hourFormat',
    );
    if (storedHourFormat) {
      this.hourFormat.next(storedHourFormat);
    }
  }

  setHourFormat(hourFormat: string): void {
    this.hourFormat.next(hourFormat);
    this.localStorageService.setItem('settings_hourFormat', hourFormat);
  }

  getHourFormat(): string {
    return this.hourFormat.getValue();
  }
}
