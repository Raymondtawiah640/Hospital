import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';  // Ensure you have the AuthService
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule

@Component({
  selector: 'app-prescriptions',
  templateUrl: './prescriptions.html',
  styleUrls: ['./prescriptions.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // <-- Add FormsModule here
})
export class Prescriptions implements OnInit {
  isLoggedIn: boolean = false;
  doctorId: string = '';
  patientName: string = '';
  patients: any[] = []; 
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  prescriptionData = {
    patientId: '',
    medicine: '',
    dosage: '',
    instructions: ''
  };

  // Success and error messages
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false; // Loading flag

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService  // <-- Inject AuthService
  ) {}

  ngOnInit() {
    // Check if the doctor is logged in
    this.isLoggedIn = this.authService.loggedIn(); // Use AuthService to check login status

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);  // Redirect to login page if not logged in
    } else {
      // Fetch list of medicines
      this.fetchMedicines();
    }
  }

  // Fetch the list of medicines (replace with actual API endpoint)
  fetchMedicines() {
    this.http.get<any[]>('https://kilnenterprise.com/presbyterian-hospital/medicines.php')
      .subscribe(
        (data) => {
          if (data && Array.isArray(data) && data.length > 0) {
            this.medicines = data;
            this.filteredMedicines = data;  // Initialize filtered medicines with all medicines
          } else {
            this.errorMessage = 'No medicines found.';
            this.successMessage = '';  // Reset success message if no medicines
          }
        },
        (error) => {
          this.errorMessage = 'Failed to fetch medicines. Please check the network or API.';
          this.successMessage = '';  // Reset success message on error
        }
      );
  }

  // Function to filter medicines by name
  filterMedicines() {
    if (this.prescriptionData.medicine) {
      this.filteredMedicines = this.medicines.filter(medicine => 
        medicine.name.toLowerCase().includes(this.prescriptionData.medicine.toLowerCase())
      );
    } else {
      this.filteredMedicines = this.medicines; // If no filter, show all medicines
    }
  }

  // Function to deduct medicine quantity
  updateMedicineStock() {
    const selectedMedicine = this.medicines.find(medicine => medicine.name === this.prescriptionData.medicine);
    if (selectedMedicine && selectedMedicine.stock_quantity > 0) {
      selectedMedicine.stock_quantity--; // Deduct one unit from the stock
      this.http.post('https://kilnenterprise.com/presbyterian-hospital/update_medicine_stock.php', {
        id: selectedMedicine.id,
        stock_quantity: selectedMedicine.stock_quantity
      }).subscribe(
        (response) => {
          this.successMessage = 'Medicine stock updated successfully.';
        },
        (error) => {
          this.errorMessage = 'Failed to update medicine stock.';
          this.successMessage = '';  // Reset success message on error
        }
      );
    } else {
      this.errorMessage = 'Out of stock for the selected medicine.';
      this.successMessage = '';  // Reset success message
    }
  }

  // Function to filter patients by name
  searchPatient() {
    if (this.patientName) {
      this.http.get<any[]>(`https://kilnenterprise.com/presbyterian-hospital/get-patients.php?name=${this.patientName}`)
        .subscribe(
          (data) => {
            this.patients = data;
            if (data.length === 0) {
              this.errorMessage = 'No patients found with that name.';
              this.successMessage = '';  // Reset success message
            } else {
              this.successMessage = '';  // Reset success message
            }
          },
          (error) => {
            this.errorMessage = 'Failed to search patients.';
            this.successMessage = '';  // Reset success message
          }
        );
    } else {
      this.errorMessage = 'Please enter a patient name to search.';
      this.successMessage = '';  // Reset success message
    }
  }

  prescribeMedicine() {
  // Log the prescription data to ensure it's correct
  console.log('Prescription Data:', this.prescriptionData); 

  if (this.prescriptionData.patientId && this.prescriptionData.medicine && this.prescriptionData.dosage) {
    this.isLoading = true;  // Show loading spinner

    // Send the request
    this.http.post('https://kilnenterprise.com/presbyterian-hospital/prescriptions.php', this.prescriptionData)
      .subscribe(
        (response) => {
          // Log the successful response for debugging
          console.log('Success Response:', response);

          // Success logic
          this.isLoading = false;  // Hide loading spinner
          this.successMessage = 'Prescription successfully created.';
          this.errorMessage = '';  // Clear any previous error message

          // Update medicine stock after successful prescription
          this.updateMedicineStock();
        },
        (error) => {
          // Log the error for debugging
          console.error('Error Response:', error);

          // Error logic
          this.isLoading = false;  // Hide loading spinner
          if (error.status && error.message) {
            this.errorMessage = `Error: ${error.status} - ${error.message}`;
          } else {
            this.errorMessage = 'An unknown error occurred.';
          }
          this.successMessage = '';  // Clear success message on error
        }
      );
  } else {
    // Validation logic if form fields are empty
    this.errorMessage = 'All fields must be filled out to prescribe medicine.';
    this.successMessage = '';  // Reset success message
  }
}
}
