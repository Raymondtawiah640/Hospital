import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Import the AuthService
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.html',
  styleUrls: ['./schedules.css'],
  imports: [FormsModule, CommonModule]  // Ensure FormsModule and CommonModule are imported
})
export class Schedules implements OnInit {
  doctors: any[] = [];
  scheduleData = {
    doctorId: 0,  // Set default value as 0 (number)
    day: '',
    startTime: '',
    endTime: '',
    department: ''
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
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
      this.loadDoctors();  // Load doctors on component initialization
    }
  }

  // Load doctor data
  loadDoctors(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php') // Endpoint to get doctor list
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

  // Handle form submission for adding schedule
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    // Ensure doctorId is a number before sending it to the server
    this.scheduleData.doctorId = +this.scheduleData.doctorId;  // Convert to number using unary plus

    if (this.scheduleData.doctorId && this.scheduleData.day && this.scheduleData.startTime && this.scheduleData.endTime && this.scheduleData.department) {
      // Send data as POST request to add schedule
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-schedule.php', this.scheduleData, {
        headers: { 'Content-Type': 'application/json' }
      }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'Schedule added successfully!';
          } else {
            this.errorMessage = response.message || 'Failed to add schedule.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error adding schedule:', err);
          this.errorMessage = 'There was a problem with the request. Please try again later.';
        }
      });
    } else {
      this.isLoading = false;
      this.errorMessage = 'Please fill in all fields.';
    }
  }
}
