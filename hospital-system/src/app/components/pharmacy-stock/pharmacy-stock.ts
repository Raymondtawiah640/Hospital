import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pharmacy-stock',
  templateUrl: './pharmacy-stock.html',
  styleUrls: ['./pharmacy-stock.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PharmacyStock implements OnInit {
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchTerm: string = '';
  isLoggedIn: boolean = false;

  // Summary counts
  totalMedicines: number = 0;
  inStockCount: number = 0;
  outOfStockCount: number = 0;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;

  // Form related
  showForm: boolean = false;
  isEditing: boolean = false;
  currentMedicine: any = {
    id: null,
    name: '',
    price: 0,
    stock_quantity: 0,
    description: ''
  };

  // Modal related
  showViewModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedMedicine: any = null;

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.fetchMedicines();
    }
  }

  fetchMedicines(page: number = 1): void {
    this.isLoading = true;
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/medicines.php?page=${page}&limit=${this.itemsPerPage}`;

    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (Array.isArray(response)) {
          // Old format: direct array
          this.medicines = response;
          this.currentPage = 1;
          this.totalPages = 1;
          this.totalMedicines = response.length;
          this.calculateSummary();
          this.filteredMedicines = this.medicines;
        } else if (response.medicines && Array.isArray(response.medicines)) {
          // New format: with pagination
          this.medicines = response.medicines;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
          this.totalMedicines = response.pagination.totalItems;
          this.calculateSummary();
          this.filteredMedicines = this.medicines;
        } else {
          this.errorMessage = response.message || 'Error fetching medicines.';
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = '❌ Error fetching medicines.';
      }
    );
  }

  calculateSummary(): void {
    this.totalMedicines = this.medicines.length;
    this.inStockCount = this.medicines.filter(m => m.stock_quantity > 0).length;
    this.outOfStockCount = this.medicines.filter(m => m.stock_quantity === 0).length;
  }

  filterMedicines(): void {
    if (!this.searchTerm) {
      this.filteredMedicines = this.medicines;
    } else {
      this.filteredMedicines = this.medicines.filter((medicine: any) => {
        const searchStr = `${medicine.name} ${medicine.description || ''}`.toLowerCase();
        return searchStr.includes(this.searchTerm.toLowerCase());
      });
    }
  }

  ngDoCheck(): void {
    this.filterResults();
  }

  filterResults(): void {
    this.filterMedicines();
  }

  getStatus(quantity: number): string {
    return quantity > 0 ? 'In Stock' : 'Out of Stock';
  }

  getStatusClass(quantity: number): string {
    return quantity > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
  }

  addNewMedicine(): void {
    this.isEditing = false;
    this.currentMedicine = {
      id: null,
      name: '',
      price: 0,
      stock_quantity: 0,
      description: ''
    };
    this.showForm = true;
  }

  viewMedicine(medicine: any): void {
    this.selectedMedicine = medicine;
    this.showViewModal = true;
  }

  editMedicine(medicine: any): void {
    this.isEditing = true;
    this.currentMedicine = { ...medicine };
    this.showForm = true;
  }

  saveMedicine(): void {
    if (this.isEditing) {
      this.updateMedicine();
    } else {
      this.createMedicine();
    }
  }

  createMedicine(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/medicines.php';
    this.http.post<any>(apiUrl, this.currentMedicine).subscribe(
      (response) => {
        if (response.success) {
          this.fetchMedicines();
          this.showForm = false;
        } else {
          this.errorMessage = response.message;
        }
      },
      (error) => {
        this.errorMessage = 'Error adding medicine.';
      }
    );
  }

  updateMedicine(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/update-medicine.php';
    this.http.put<any>(apiUrl, this.currentMedicine).subscribe(
      (response) => {
        if (response.success) {
          this.fetchMedicines();
          this.showForm = false;
        } else {
          this.errorMessage = response.message;
        }
      },
      (error) => {
        this.errorMessage = 'Error updating medicine.';
      }
    );
  }

  deleteMedicine(medicine: any): void {
    this.selectedMedicine = medicine;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/delete-medicine.php';
    this.http.delete<any>(apiUrl, { body: { id: this.selectedMedicine.id } }).subscribe(
      (response) => {
        if (response.success) {
          this.fetchMedicines();
          this.closeModals();
        } else {
          this.errorMessage = response.message;
          this.closeModals();
        }
      },
      (error) => {
        this.errorMessage = 'Error deleting medicine.';
        this.closeModals();
      }
    );
  }

  cancelForm(): void {
    this.showForm = false;
  }

  closeModals(): void {
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.selectedMedicine = null;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.fetchMedicines(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.fetchMedicines(this.currentPage + 1);
    }
  }
}
