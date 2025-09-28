import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';  // Import the AuthService

@Component({
  selector: 'app-add-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-patient.html',
  styleUrls: ['./add-patient.css']
})
export class AddPatient implements OnInit {
  // Model for form data
  firstName: string = '';
  lastName: string = '';
  ghanaCardNumber: string = '';
  dateOfBirth: string = '';
  gender: string = '';
  bloodGroup: string = '';
  phoneNumber: string = '';
  email: string = '';
  residentialAddr: string = '';
  emergencyName: string = '';
  emergencyPhone: string = '';
  message: string = '';  // For error/success messages
  isLoggedIn: boolean = false;  // Variable to hold login status

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  // Check login status when the component is initialized
  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    }
  }

  // Submit the form
  onSubmit(event: Event) {
    event.preventDefault();  // Prevent form refresh (page reload)

    const patientData = {
      first_name: this.firstName,
      last_name: this.lastName,
      ghana_card_number: this.ghanaCardNumber,
      date_of_birth: this.dateOfBirth,
      gender: this.gender,
      blood_group: this.bloodGroup,
      phone_number: this.phoneNumber,
      email: this.email,
      residential_addr: this.residentialAddr,
      emergency_name: this.emergencyName,
      emergency_phone: this.emergencyPhone
    };

    // Send POST request to the backend (replace with your actual PHP endpoint)
    this.http.post('https://kilnenterprise.com/presbyterian-hospital/add-patient.php', patientData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.message = '✅ Patient added successfully';
          
          // Wait for a brief moment to show the success message, then reload the page
          setTimeout(() => {
            location.reload();  // This will refresh the page after the success message is displayed
          }, 1000); // 1 second delay to allow the message to be shown
        } else {
          this.message = response.message || '❌ Incomplete data. Please fill all required fields.';
        }
      },
      error: () => {
        // Display a friendly error message to the user, without revealing technical details
        this.message = '❌ There was an issue saving the patient. Please try again later.';
      }
    });
  }
}
