import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service'; // Update the path as necessary

@Injectable({
  providedIn: 'root',  // ensures it's available throughout the application
})
export class AuthGuard implements CanActivate {
  constructor (private authService: AuthService, private router: Router){}
  // private authService = inject(AuthService);
  // private router = inject(Router);

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['']); // Redirect to login if not authenticated
      return false;
    }
  }
}