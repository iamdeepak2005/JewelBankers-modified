// src/app/local-storage.service.ts (or wherever you placed it)
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private storageSubject: BehaviorSubject<any>;

  constructor(private userService: UserService) {
    // Initialize with the current value from localStorage
    const savedData = localStorage.getItem('responseDataVoice');
    this.storageSubject = new BehaviorSubject(savedData ? JSON.parse(savedData) : null);

    // Listen for changes in localStorage
    window.addEventListener('storage', (event) => {
      if (event.key === 'responseDataVoice') {
        this.storageSubject.next(event.newValue ? JSON.parse(event.newValue) : null);
      }
    });
  }

  // Method to get observable for subscription
  getStorage(): BehaviorSubject<any> {
    return this.storageSubject;
  }

  // Method to set/update localStorage value
  setStorage(value: any): void {
    try{
      localStorage.setItem('yourKey', JSON.stringify(value));
    }          catch (error) {
  this.userService.handleStorageError(error);
}
    this.storageSubject.next(value);
  }
}
