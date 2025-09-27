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

  constructor(private router: Router, private auth: AuthService) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.message = '';

    // Strong password regex
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    // Check required fields
    if (!this.staff_id || !this.department || !this.password) {
      this.message = '⚠️ All fields are required';
      return;
    }

    // Check password strength
    if (!passwordRegex.test(this.password)) {
      this.message =
        '⚠️ Password must be 8-20 chars, include uppercase, lowercase, number, and special char';
      return;
    }

    // Call AuthService with all 3 values
    this.auth.login(this.staff_id, this.department, this.password).subscribe({
      next: (res) => {
        if (res.success && res.staff) {
          this.router.navigate(['/dashboard']);
        } else {
          this.message = res.message || '❌ Invalid credentials';
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.message = '❌ Server error. Please try again later';
      }
    });
  }
}
