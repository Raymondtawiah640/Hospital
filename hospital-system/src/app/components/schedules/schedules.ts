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
  imports: [FormsModule, CommonModule]  // Ensure these modules are imported
})
export class Schedules implements OnInit {
  doctors: any[] = [];
  schedules: any[] = [];
  selectedDoctor: any = null;
  scheduleData = {
    doctorId: '',
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
      this.loadSchedules(); // Load existing schedules
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
            this.doctors = data.doctors;  // Ensure this is the correct structure
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

  // Load schedule data
  loadSchedules(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-schedule.php') // Endpoint to get schedules
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.schedules = data.schedules;
          } else {
            this.errorMessage = 'Failed to load schedules.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading schedules:', err);
          this.errorMessage = 'There was a problem fetching schedules.';
        }
      });
  }

  // Handle the doctor selection change
  onDoctorChange(): void {
    const doctorId = this.scheduleData.doctorId;
    if (doctorId) {
      // Find the doctor based on ID from the list
      this.selectedDoctor = this.doctors.find(doctor => doctor.id === parseInt(doctorId));
    }
  }

  // Handle form submission
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (this.scheduleData.doctorId && this.scheduleData.day && this.scheduleData.startTime && this.scheduleData.endTime && this.scheduleData.department) {
      // Send schedule data via POST request
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-schedule.php', this.scheduleData)
        .subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.success) {
              this.successMessage = 'Schedule added successfully!';
              this.loadSchedules(); // Reload schedules after successful submission
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
