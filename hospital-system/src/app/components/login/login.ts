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

  // Password validation properties
  passwordValidation = {
    hasMinLength: false,
    hasMaxLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isValid: false
  };

  passwordStrengthMessage: string = '';
  showPasswordValidation: boolean = false;

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

  // Password validation methods
  onPasswordInput(): void {
    console.log('Password input changed:', this.password);
    this.showPasswordValidation = this.password.length > 0;
    this.validatePassword();
  }

  validatePassword(): void {
    const password = this.password || '';
    console.log('Validating password:', password);

    // Check each requirement
    this.passwordValidation.hasMinLength = password.length >= 8;
    this.passwordValidation.hasMaxLength = password.length <= 20;
    this.passwordValidation.hasLowercase = /[a-z]/.test(password);
    this.passwordValidation.hasUppercase = /[A-Z]/.test(password);
    this.passwordValidation.hasNumber = /\d/.test(password);
    this.passwordValidation.hasSpecialChar = /[@$!%*?&]/.test(password);

    // Password is valid if all requirements are met
    this.passwordValidation.isValid = this.passwordValidation.hasMinLength &&
                                      this.passwordValidation.hasMaxLength &&
                                      this.passwordValidation.hasLowercase &&
                                      this.passwordValidation.hasUppercase &&
                                      this.passwordValidation.hasNumber &&
                                      this.passwordValidation.hasSpecialChar;

    console.log('Password validation results:', this.passwordValidation);

    // Update strength message
    this.updatePasswordStrengthMessage();
  }

  updatePasswordStrengthMessage(): void {
    if (this.password.length === 0) {
      this.passwordStrengthMessage = '';
      return;
    }

    const validCount = Object.values(this.passwordValidation).filter(val => val === true).length - 1; // -1 to exclude isValid

    if (validCount === 0) {
      this.passwordStrengthMessage = '❌ Password is too weak';
    } else if (validCount <= 2) {
      this.passwordStrengthMessage = '⚠️ Password strength: Weak';
    } else if (validCount <= 4) {
      this.passwordStrengthMessage = '✅ Password strength: Good';
    } else if (validCount === 6) {
      this.passwordStrengthMessage = '💪 Password strength: Strong';
    }

    // Add specific requirement feedback
    const missing = [];
    if (!this.passwordValidation.hasMinLength) missing.push('min 8 characters');
    if (!this.passwordValidation.hasMaxLength) missing.push('max 20 characters');
    if (!this.passwordValidation.hasLowercase) missing.push('lowercase letter');
    if (!this.passwordValidation.hasUppercase) missing.push('uppercase letter');
    if (!this.passwordValidation.hasNumber) missing.push('number');
    if (!this.passwordValidation.hasSpecialChar) missing.push('special character');

    if (missing.length > 0) {
      this.passwordStrengthMessage += ` (Missing: ${missing.join(', ')})`;
    }
  }

  getValidationClass(requirement: boolean): string {
    return requirement ? 'text-green-600' : 'text-red-600';
  }

  getValidationIcon(requirement: boolean): string {
    return requirement ? '✓' : '✗';
  }

  login(): void {
    this.isLoading = true; // start loading indicator
    this.message = '';
    this.clearLockout(); // Clear any previous lockout

    // Check required fields
    if (!this.staff_id || !this.department || !this.password) {
      this.message = '⚠️ All fields are required';
      this.isLoading = false; // stop loading if validation fails
      return;
    }

    // Validate password meets all requirements
    this.validatePassword();
    if (!this.passwordValidation.isValid) {
      this.message = '❌ Password does not meet security requirements. Please ensure it includes all required elements.';
      this.isLoading = false;
      return;
    }

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
