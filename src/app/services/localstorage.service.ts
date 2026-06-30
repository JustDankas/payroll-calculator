import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {}

  // Save data to local storage
  setItem(key: string, value: any): void {
    try {
      // Local storage only stores strings, so we stringify objects/arrays
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  // Extract data from local storage
  getItem<T>(key: string): T | null {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      // Parse the string back into its original type (object, array, number, etc.)
      return JSON.parse(serializedValue, this.dateReviver) as T;
    } catch (error) {
      console.error('Error getting data from localStorage', error);
      return null;
    }
  }

  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  // Remove a specific item
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear all local storage data
  clear(): void {
    localStorage.clear();
  }

  // A regex pattern to match ISO 8601 date strings
  private isoDateFormat =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:Z|[+-]\d{2}:?\d{2})?$/;

  private dateReviver = (key: string, value: any): any => {
    // If the value is a string and matches the ISO date format, convert it to a Date object
    if (typeof value === 'string' && this.isoDateFormat.test(value)) {
      return new Date(value);
    }
    return value;
  };
}
