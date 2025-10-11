import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-general-department-result',
  imports: [CommonModule, FormsModule],
  templateUrl: './general-department-result.html',
  styleUrls: ['./general-department-result.css'],
  standalone: true
})
export class GeneralDepartmentResult implements OnInit {
  consultations: any[] = [];
  filteredConsultations: any[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  // Filter options
  selectedDoctor = '';
  selectedStatus = '';
  doctors: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get('https://kilnenterprise.com/presbyterian-hospital/get-consultations.php')
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.consultations = response.consultations || [];
            this.filteredConsultations = [...this.consultations];
            this.extractDoctors();
          } else {
            this.errorMessage = response.message || 'Failed to load consultations';
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error loading consultations:', err);
          this.errorMessage = 'Failed to load consultations. Please try again later.';
        }
      });
  }

  extractDoctors() {
    const doctorSet = new Set<string>();
    this.consultations.forEach(consultation => {
      if (consultation.doctor_name && consultation.doctor_name !== 'Not assigned') {
        doctorSet.add(consultation.doctor_name);
      }
    });
    this.doctors = Array.from(doctorSet).sort();
  }

  applyFilters() {
    this.filteredConsultations = this.consultations.filter(consultation => {
      // Text search
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch =
          consultation.patient_name?.toLowerCase().includes(searchLower) ||
          consultation.diagnosis?.toLowerCase().includes(searchLower) ||
          consultation.doctor_name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Doctor filter
      if (this.selectedDoctor && consultation.doctor_name !== this.selectedDoctor) {
        return false;
      }

      // Status filter
      if (this.selectedStatus && consultation.status !== this.selectedStatus) {
        return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedDoctor = '';
    this.selectedStatus = '';
    this.filteredConsultations = [...this.consultations];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  trackByConsultationId(index: number, consultation: any): number {
    return consultation.id;
  }
}
