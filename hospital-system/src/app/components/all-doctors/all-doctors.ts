import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import the AuthService
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-doctors',
  templateUrl: './all-doctors.html',
  styleUrls: ['./all-doctors.css'],
  imports: [FormsModule, CommonModule]  // Import FormsModule and CommonModule here
})
export class AllDoctors implements OnInit {
  doctors: any[] = [];  // Array to hold doctors
  selectedDoctorSchedules: any[] = [];  // Array to hold selected doctor's schedules
  selectedDoctorId: number = 0;  // Store selected doctor ID

  isLoading: boolean = false;  // Loading state for API calls
  errorMessage: string = '';  // To store error message
  isLoggedIn: boolean = false;  // To store login status

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService  // Inject AuthService
  ) {}

  ngOnInit(): void {
    // Check if the user is logged in
    this.isLoggedIn = this.authService.loggedIn();
    
    // If not logged in, redirect to login page
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.loadDoctors();  // Load doctor data on component initialization
    }
  }

  // Load doctor data with schedules
  loadDoctors(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php')  // Endpoint to get doctors
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.doctors = data.doctors;  // Store the list of doctors
          } else {
            this.errorMessage = 'Failed to load doctor data.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading doctors:', err);
          this.errorMessage = 'There was a problem fetching doctor data.';
        }
      });
  }

  // Load schedules for the selected doctor
  loadDoctorSchedules(doctorId: number): void {
    this.isLoading = true;
    this.http.get(`https://kilnenterprise.com/presbyterian-hospital/get-schedule.php?doctorId=${doctorId}`)  // Endpoint to get schedules for specific doctor
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.selectedDoctorSchedules = data.schedules;  // Store schedules for the selected doctor
          } else {
            this.errorMessage = 'Failed to load schedules for the selected doctor.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading schedules:', err);
          this.errorMessage = 'There was a problem fetching schedules.';
        }
      });
  }

  // Handle doctor selection change
  onDoctorChange(event: any): void {
    const selectedDoctorId = event.target.value;  // Get selected doctor ID
    this.selectedDoctorId = selectedDoctorId;
    if (selectedDoctorId) {
      this.loadDoctorSchedules(selectedDoctorId);  // Load schedules for the selected doctor
    } else {
      this.selectedDoctorSchedules = [];  // Clear schedules if no doctor is selected
    }
  }
}
