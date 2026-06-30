import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private hourFormat = new BehaviorSubject<string>('12');
  hourFormat$ = this.hourFormat.asObservable();
  constructor() {}

  setHourFormat(hourFormat: string): void {
    this.hourFormat.next(hourFormat);
  }
}
