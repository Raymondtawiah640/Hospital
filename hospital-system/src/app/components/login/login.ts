import { Component } from '@angular/core';
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

  constructor(private router: Router, private auth: AuthService) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.isLoading = true; // start loading indicator
    this.message = '';

    // Strong password regex
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    // Check required fields
    if (!this.staff_id || !this.department || !this.password) {
      this.message = '⚠️ All fields are required';
      this.isLoading = false; // stop loading if validation fails
      return;
    }

    // Check password strength
    if (!passwordRegex.test(this.password)) {
      this.message =
        '⚠️ Password must be 8-20 chars, include uppercase, lowercase, number, and special char';
      this.isLoading = false; // stop loading if password doesn't meet criteria
      return;
    }

    // Call AuthService with all 3 values
    this.auth.login(this.staff_id, this.department, this.password).subscribe({
      next: (res) => {
        this.isLoading = false; // stop loading after response
        if (res.success && res.staff) {
          this.router.navigate(['/dashboard']);
        } else {
          // More user-friendly error handling
          this.message = '❌ The credentials provided do not match our records. Please double-check and try again.';
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
