import { Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth'; // import your AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Login {
  staff_id: string = '';
  department: string = '';
  password: string = '';
  message: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false; // to handle the loading state
  lockoutTimer: any;
  remainingTime: number = 0;

  constructor(private router: Router, private auth: AuthService, private ngZone: NgZone) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  startLockout(remainingTime: number): void {
    this.remainingTime = remainingTime;
    this.message = `❌ Too many failed attempts. Try again in ${Math.ceil(this.remainingTime / 60)} minute(s).`;
    this.ngZone.run(() => {
      this.lockoutTimer = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          this.clearLockout();
        } else {
          this.message = `❌ Too many failed attempts. Try again in ${Math.ceil(this.remainingTime / 60)} minute(s).`;
        }
      }, 1000);
    });
  }

  clearLockout(): void {
    if (this.lockoutTimer) {
      clearInterval(this.lockoutTimer);
      this.lockoutTimer = null;
    }
    this.remainingTime = 0;
    this.message = '';
  }

  login(): void {
    this.isLoading = true; // start loading indicator
    this.message = '';
    this.clearLockout(); // Clear any previous lockout

    // Strong password regex
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    // Check required fields
    if (!this.staff_id || !this.department || !this.password) {
      this.message = '⚠️ All fields are required';
      this.isLoading = false; // stop loading if validation fails
      return;
    }

    // Password strength check removed for first login flexibility

    // Call AuthService with all 3 values
    this.auth.login(this.staff_id, this.department, this.password).subscribe({
      next: (res) => {
        this.isLoading = false; // stop loading after response
        if (res.success && res.staff) {
          this.clearLockout();
          this.router.navigate(['/dashboard']);
        } else {
          // Handle lockout
          if (res.lockout && res.remainingTime) {
            this.startLockout(res.remainingTime);
          } else {
            // More user-friendly error handling
            this.message = res.message || '❌ The credentials provided do not match our records. Please double-check and try again.';
          }
        }
      },
      error: (err) => {
        this.isLoading = false; // stop loading in case of error
        console.error('Login error:', err);

        // General error handling
        this.message = '❌ Something went wrong. Please check your credentials and try again.';
      }
    });
  }
}
