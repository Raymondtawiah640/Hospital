import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import your AuthService
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-doctor',
  templateUrl: './add-doctor.html',
  styleUrls: ['./add-doctor.css'],
  imports: [FormsModule, CommonModule]  // Make sure FormsModule is added for ngModel
})
export class AddDoctor implements OnInit {
  // Initialize the doctorData object with empty values
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
  isLoggedIn: boolean = false;
  errorMessage: string = '';  // To store error messages
  successMessage: string = '';  // To store success messages
  isLoading: boolean = false;  // To manage loading state

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if the user is logged in
    this.isLoggedIn = this.authService.loggedIn();

    // If not logged in, redirect to login page
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;  // Start loading

    // Check if user is logged in
    if (this.isLoggedIn) {
      // Send POST request to backend with doctorData
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-doctor.php', this.doctorData)
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;  // Stop loading
            if (response.success) {
              this.successMessage = 'Doctor added successfully!';
              this.resetForm();  // Reset form fields after successful submission
              setTimeout(() => {
                this.router.navigate(['/add-doctor']);  // Refresh the page by navigating to the same route
              }, 1500);  // Wait for 1.5 seconds before navigating back
            } else {
              this.errorMessage = response.message || 'An error occurred while adding the doctor.';
            }
          },
          error: (err) => {
            this.isLoading = false;  // Stop loading on error
            console.error('Error adding doctor:', err);
            this.errorMessage = 'There was a problem with the request. Please try again later.';
          }
        });
    } else {
      // If not logged in, redirect to login page
      this.router.navigate(['/login']);
    }
  }

  // Reset form data after submission
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
