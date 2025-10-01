import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-doctors',
  templateUrl: './all-doctors.html',
  styleUrls: ['./all-doctors.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class AllDoctors implements OnInit {
  doctors: any[] = [];
  selectedDoctorSchedules: any[] = [];
  selectedDoctorId: number = 0;

  isLoading: boolean = false;
  errorMessage: string = '';
  isLoggedIn: boolean = false;

  searchTerm: string = ''; // 🔍 New: search input model

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.loadDoctors();
    }
  }

  loadDoctors(): void {
    this.isLoading = true;
    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-doctor.php')
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.doctors = data.doctors;
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

  loadDoctorSchedules(doctorId: number): void {
    this.isLoading = true;
    this.http.get(`https://kilnenterprise.com/presbyterian-hospital/get-schedule.php?doctorId=${doctorId}`)
      .subscribe({
        next: (data: any) => {
          this.isLoading = false;
          if (data.success) {
            this.selectedDoctorSchedules = data.schedules;
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

  onDoctorChange(event: any): void {
    const selectedDoctorId = event.target.value;
    this.selectedDoctorId = selectedDoctorId;
    if (selectedDoctorId) {
      this.loadDoctorSchedules(selectedDoctorId);
    } else {
      this.selectedDoctorSchedules = [];
    }
  }

  // 🔍 Getter to filter doctors based on search term
  get filteredDoctors(): any[] {
    const term = this.searchTerm.toLowerCase();
    return this.doctors.filter(doctor =>
      doctor.first_name.toLowerCase().includes(term) ||
      doctor.last_name.toLowerCase().includes(term) ||
      doctor.doctor_id.toLowerCase().includes(term)
    );
  }
}
