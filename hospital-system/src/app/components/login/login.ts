import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // <-- Add this
})
export class Login {
  staff_id: string = '';
  department: string = '';
  password: string = '';
  message: string = '';

  private apiUrl = 'http://207.180.192.46/presbyterian-hospital/includes/login.php';

  constructor(private http: HttpClient, private router: Router, private auth: Auth) {}

  login(): void {
    if (!this.staff_id || !this.department || !this.password) {
      this.message = '⚠️ All fields are required';
      return;
    }

    const payload = { staff_id: this.staff_id, department: this.department, password: this.password };

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (res) => {
        if (res.success) {
          localStorage.setItem('staff', JSON.stringify({
            staff_id: this.staff_id,
            full_name: res.staff?.full_name ?? '',
            department: this.department
          }));
          this.router.navigate(['/dashboard']); // redirect to dashboard
        } else {
          this.message = res.message; // show error from PHP
        }
      },
      error: () => {
        this.message = '❌ Server error. Please try again later';
      }
    });
  }
}
