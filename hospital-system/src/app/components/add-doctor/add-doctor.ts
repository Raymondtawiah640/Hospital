import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-doctor',
  templateUrl: './add-doctor.html',
  styleUrls: ['./add-doctor.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class AddDoctor implements OnInit {
  doctorData = {
    doctorId: '',
    ghanaCard: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    specialization: '',
    department: '',
    experience: '',
    license: '',
    phone: '',
    email: '',
    address: ''
  };

  isLoggedIn = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (this.isLoggedIn) {
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-doctor.php', this.doctorData)
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.success) {
              this.successMessage = 'Doctor added successfully!';
              this.resetForm();
              setTimeout(() => {
                this.router.navigate(['/add-doctor']);
              }, 1500);
            } else {
              this.errorMessage = response.message || 'An error occurred while adding the doctor.';
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error adding doctor:', err);
            this.errorMessage = 'There was a problem with the request. Please try again later.';
          }
        });
    } else {
      this.router.navigate(['/login']);
    }
  }

  resetForm() {
    this.doctorData = {
      doctorId: '',
      ghanaCard: '',
      firstName: '',
      lastName: '',
      dob: '',
      gender: '',
      specialization: '',
      department: '',
      experience: '',
      license: '',
      phone: '',
      email: '',
      address: ''
    };
  }
}
