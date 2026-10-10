import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: false
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  message: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe(
        response => {
          this.message = 'Reset password link has been sent to your email.';
          this.error = null;
          this.isLoading = false;
        },
        error => {
          this.error = 'Failed to send reset password link. Please try again.';
          this.message = null;
          this.isLoading = false;
        }
      );
    }
  }
}
