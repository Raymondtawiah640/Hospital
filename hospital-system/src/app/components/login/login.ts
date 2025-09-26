import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Login {
  staff_id = '';
  department = '';
  password = '';
  message = '';

  constructor(private http: HttpClient, private router: Router, private auth: Auth) {}

  login() {
    this.auth.login(this.staff_id, this.password).subscribe(res => {
      if (res.success) {
        this.router.navigate(['/dashboard']); // redirect after login
      } else {
        this.message = res.message;
      }
    });
  }
}
