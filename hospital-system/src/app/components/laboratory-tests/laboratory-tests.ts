import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LabTest {
  id: number;
  name: string;
  patient: string;
  doctor: string;
  date: Date;
  status: 'Completed' | 'Pending' | 'Cancelled';
  type?: string;
}

@Component({
  selector: 'app-laboratory-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './laboratory-tests.html',
  styleUrls: ['./laboratory-tests.css']
})
export class LaboratoryTests {
  searchTerm: string = '';

  labTests: LabTest[] = [
    { id: 1, name: 'Complete Blood Count', patient: 'John Doe', doctor: 'Dr. Smith', date: new Date('2025-09-20'), status: 'Completed', type: 'Hematology' },
    { id: 2, name: 'Urine Test', patient: 'Jane Doe', doctor: 'Dr. Adams', date: new Date('2025-09-21'), status: 'Pending', type: 'Pathology' },
    { id: 3, name: 'Liver Function Test', patient: 'Michael Johnson', doctor: 'Dr. Clark', date: new Date('2025-09-22'), status: 'Cancelled', type: 'Biochemistry' }
  ];

  // Filtered list based on search term
  get filteredTests(): LabTest[] {
    if (!this.searchTerm) return this.labTests;
    const term = this.searchTerm.toLowerCase();
    return this.labTests.filter(t =>
      t.name.toLowerCase().includes(term) ||
      t.patient.toLowerCase().includes(term) ||
      t.doctor.toLowerCase().includes(term) ||
      (t.type?.toLowerCase().includes(term))
    );
  }

  // Count tests by status
  countByStatus(status: LabTest['status']): number {
    return this.labTests.filter(t => t.status === status).length;
  }

  openAddTestModal() {
    alert('Open add test modal');
  }

  viewTest(test: LabTest) {
    alert(`Viewing test: ${test.name} for ${test.patient}`);
  }

  editTest(test: LabTest) {
    alert(`Editing test: ${test.name}`);
  }

  deleteTest(test: LabTest) {
    if (confirm(`Are you sure you want to delete test: ${test.name}?`)) {
      this.labTests = this.labTests.filter(t => t.id !== test.id);
    }
  }
}
