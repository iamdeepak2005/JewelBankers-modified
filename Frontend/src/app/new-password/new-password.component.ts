import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
  standalone: false
})
export class NewPasswordComponent implements OnInit {
  newPasswordForm: FormGroup;
  token!: string;
  error: string | null = null;
  message: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.newPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    if (this.newPasswordForm.valid) {
      this.isLoading = true;
      const payload = {
        token: this.token,
        password: this.newPasswordForm.value.password
      };
      this.authService.resetPassword(payload).subscribe(
        response => {
          this.message = 'Password has been successfully reset.';
          this.error = null;
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error => {
          this.error = 'Failed to reset password. Please try again.';
          this.message = null;
          this.isLoading = false;
        }
      );
    }
  }
}
