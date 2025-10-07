import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Invoices implements OnInit, OnDestroy {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchTerm: string = '';
  isLoggedIn: boolean = false;
  private messageTimer: any;

  // Summary counts
  totalInvoices: number = 0;
  paidInvoices: number = 0;
  pendingInvoices: number = 0;
  overdueInvoices: number = 0;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  itemsPerPage: number = 10;

  // Modal related
  showViewModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedInvoice: any = null;

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  // Method to set success message with auto-hide
  private setSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.clearMessageAfterDelay();
  }

  // Method to set error message with auto-hide
  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.clearMessageAfterDelay();
  }

  // Method to clear messages after 5 seconds
  private clearMessageAfterDelay(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    this.messageTimer = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  // Clear timer when component is destroyed
  ngOnDestroy(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.loggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.fetchInvoices();
    }
  }

  fetchInvoices(page: number = 1): void {
    this.isLoading = true;
    const apiUrl = `https://kilnenterprise.com/presbyterian-hospital/billing.php?page=${page}&limit=${this.itemsPerPage}`;
    this.http.get<any>(apiUrl).subscribe(
      (response) => {
        this.isLoading = false;
        if (Array.isArray(response)) {
          this.invoices = response;
          this.currentPage = 1;
          this.totalPages = 1;
        } else if (response.bills && Array.isArray(response.bills)) {
          this.invoices = response.bills;
          this.currentPage = response.pagination.currentPage;
          this.totalPages = response.pagination.totalPages;
        } else {
          this.setErrorMessage(response.message || 'Error fetching invoices.');
          return;
        }
        this.totalInvoices = this.invoices.length;
        this.calculateSummary();
        this.filteredInvoices = this.invoices;
      },
      (error) => {
        this.isLoading = false;
        this.setErrorMessage('Error fetching invoices.');
      }
    );
  }

  calculateSummary(): void {
    this.totalInvoices = this.invoices.length;
    this.paidInvoices = this.invoices.filter(b => b.status === 'paid').length;
    this.pendingInvoices = this.invoices.filter(b => b.status === 'pending').length;
    this.overdueInvoices = this.invoices.filter(b => b.status === 'overdue').length;
  }

  filterInvoices(): void {
    if (!this.searchTerm) {
      this.filteredInvoices = this.invoices;
    } else {
      this.filteredInvoices = this.invoices.filter((invoice: any) => {
        const searchStr = `${invoice.invoice_number} ${invoice.patient_name} ${invoice.doctor_name} ${invoice.amount} ${invoice.status}`.toLowerCase();
        return searchStr.includes(this.searchTerm.toLowerCase());
      });
    }
  }

  ngDoCheck(): void {
    this.filterResults();
  }

  filterResults(): void {
    this.filterInvoices();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'text-green-600 font-semibold';
      case 'pending': return 'text-yellow-600 font-semibold';
      case 'overdue': return 'text-red-600 font-semibold';
      default: return 'text-gray-600 font-semibold';
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.fetchInvoices(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.fetchInvoices(this.currentPage + 1);
    }
  }

  viewInvoice(invoice: any): void {
    this.selectedInvoice = invoice;
    this.showViewModal = true;
  }

  deleteInvoice(invoice: any): void {
    this.selectedInvoice = invoice;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/delete-bill.php';
    this.http.delete<any>(apiUrl, { body: { id: this.selectedInvoice.id } }).subscribe(
      (response) => {
        if (response.success) {
          this.fetchInvoices();
          this.closeModals();
          this.setSuccessMessage('Invoice deleted successfully');
        } else {
          this.setErrorMessage(response.message);
          this.closeModals();
        }
      },
      (error) => {
        this.setErrorMessage('Error deleting invoice.');
        this.closeModals();
      }
    );
  }

  printInvoice(): void {
    if (this.selectedInvoice) {
      const printContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
          <h1 style="text-align: center; color: #333;">Presbyterian Hospital</h1>
          <h2 style="text-align: center;">Invoice</h2>
          <div style="margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${this.selectedInvoice.invoice_number}</p>
            <p><strong>Patient Name:</strong> ${this.selectedInvoice.patient_name}</p>
            <p><strong>Doctor Name:</strong> ${this.selectedInvoice.doctor_name}</p>
            <p><strong>Amount:</strong> $${this.selectedInvoice.amount}</p>
            <p><strong>Date:</strong> ${this.selectedInvoice.date}</p>
            <p><strong>Status:</strong> ${this.selectedInvoice.status}</p>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <p>Thank you for choosing Presbyterian Hospital</p>
          </div>
        </div>
      `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  closeModals(): void {
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.selectedInvoice = null;
  }
}
