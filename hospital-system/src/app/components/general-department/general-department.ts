import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
 selector: 'app-general-department',
 templateUrl: './general-department.html',
 styleUrls: ['./general-department.css'],
 standalone: true,
 imports: [FormsModule, CommonModule]
})
export class GeneralDepartment implements OnInit {
 // Authentication
 isLoggedIn = false;

 // Patient consultation data
 consultationData = {
   patientId: '',
   patientName: '',
   age: '',
   gender: '',
   phone: '',
   email: '',
   address: '',

   // Consultation details
   chiefComplaint: '',
   historyOfPresentIllness: '',
   pastMedicalHistory: '',
   currentMedications: '',
   allergies: '',

   // Vital signs
   bloodPressure: '',
   temperature: '',
   pulse: '',
   respiratoryRate: '',
   oxygenSaturation: '',
   weight: '',
   height: '',

   // Physical examination
   generalAppearance: '',
   cardiovascular: '',
   respiratory: '',
   abdominal: '',
   neurological: '',

   // Assessment and plan
   diagnosis: '',
   treatmentPlan: '',
   medications: '',
   followUpInstructions: '',
   referralNeeded: false,
   referralDepartment: '',

   // Consultation metadata
   consultationDate: '',
   consultingDoctor: '',
   urgency: 'routine'
 };

 // Common symptoms and conditions
 commonSymptoms = [
   'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Vomiting',
   'Diarrhea', 'Constipation', 'Chest Pain', 'Shortness of Breath',
   'Abdominal Pain', 'Back Pain', 'Joint Pain', 'Skin Rash',
   'Dizziness', 'Insomnia', 'Loss of Appetite'
 ];

 commonConditions = [
   'Upper Respiratory Infection', 'Hypertension', 'Diabetes Mellitus',
   'Gastroenteritis', 'Urinary Tract Infection', 'Anxiety',
   'Depression', 'Asthma', 'Allergic Rhinitis', 'Dermatitis',
   'Arthritis', 'Migraine', 'Anemia', 'Thyroid Disorders'
 ];

 commonMedications = [
   'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin',
   'Cetirizine', 'Omeprazole', 'Metformin', 'Amlodipine',
   'Salbutamol', 'Prednisolone', 'Vitamin D', 'Iron Supplements'
 ];

 // UI state
 errorMessage = '';
 successMessage = '';
 isLoading = false;
 showVitalsSection = false;
 showExaminationSection = false;
 showTreatmentSection = false;

 // Form sections visibility
 activeSection = 'patient-info';

 // Field validation states for asterisk colors
 fieldStates: { [key: string]: boolean } = {};

 // Required fields for each section
 requiredFieldsBySection = {
   'patient-info': ['patientId', 'patientName', 'age', 'gender'],
   'consultation': ['chiefComplaint'],
   'vitals': [], // Optional fields in vitals section
   'examination': [], // Optional fields in examination section
   'treatment': ['diagnosis'] // Only diagnosis is required in treatment
 };

 constructor(
   private http: HttpClient,
   private router: Router,
   private authService: AuthService
 ) {}

 ngOnInit(): void {
   this.isLoggedIn = this.authService.loggedIn();
   this.consultationData.consultationDate = new Date().toISOString().split('T')[0];
   this.consultationData.consultingDoctor = this.getCurrentDoctorName();

   if (!this.isLoggedIn) {
     this.router.navigate(['/login']);
   }

   // Initialize field states
   this.initializeFieldStates();

   // Debug: Log initial diagnosis field state
   console.log('Initial diagnosis field state:', {
     value: this.consultationData.diagnosis,
     isFilled: this.isFieldFilled('diagnosis'),
     fieldState: this.fieldStates['diagnosis']
   });
 }

 getCurrentDoctorName(): string {
   // This would typically come from the auth service or user profile
   return 'Dr. General Physician';
 }

 // Section navigation
 nextSection(currentSection: string) {
   switch(currentSection) {
     case 'patient-info':
       this.activeSection = 'consultation';
       break;
     case 'consultation':
       this.activeSection = 'vitals';
       break;
     case 'vitals':
       this.activeSection = 'examination';
       break;
     case 'examination':
       this.activeSection = 'treatment';
       break;
   }
 }

 prevSection(currentSection: string) {
   switch(currentSection) {
     case 'consultation':
       this.activeSection = 'patient-info';
       break;
     case 'vitals':
       this.activeSection = 'consultation';
       break;
     case 'examination':
       this.activeSection = 'vitals';
       break;
     case 'treatment':
       this.activeSection = 'examination';
       break;
   }
 }

 // Quick symptom selection
 addSymptom(symptom: string) {
   const current = this.consultationData.chiefComplaint;
   this.consultationData.chiefComplaint = current ? `${current}, ${symptom}` : symptom;
   // Update field state when symptom is added via quick-select
   this.onFieldChange('chiefComplaint');
 }

 // Quick condition selection
 setDiagnosis(condition: string) {
   this.consultationData.diagnosis = condition;
   // Update field state when diagnosis is set via quick-select
   this.onFieldChange('diagnosis');
 }

 // Quick medication addition
 addMedication(medication: string) {
   const current = this.consultationData.medications;
   this.consultationData.medications = current ? `${current}, ${medication}` : medication;
   // Update field state when medication is added via quick-select
   this.onFieldChange('medications');
 }

 // Calculate BMI
 calculateBMI(): number {
   if (this.consultationData.weight && this.consultationData.height) {
     const heightM = parseFloat(this.consultationData.height) / 100;
     const weight = parseFloat(this.consultationData.weight);
     return parseFloat((weight / (heightM * heightM)).toFixed(1));
   }
   return 0;
 }

 // Submit consultation
 submitConsultation() {
   this.errorMessage = '';
   this.successMessage = '';
   this.isLoading = true;

   if (this.isLoggedIn) {
     const apiUrl = 'https://kilnenterprise.com/presbyterian-hospital/save-consultation.php';

     this.http.post(apiUrl, this.consultationData)
       .subscribe({
         next: (response: any) => {
           this.isLoading = false;
           if (response.success) {
             this.successMessage = 'Consultation saved successfully!';
             this.resetForm();
             setTimeout(() => {
               this.successMessage = '';
             }, 3000);
           } else {
             this.errorMessage = response.message || 'An error occurred while saving the consultation.';
             setTimeout(() => {
               this.errorMessage = '';
             }, 5000);
           }
         },
         error: (err) => {
           this.isLoading = false;
           console.error('Error saving consultation:', err);
           this.errorMessage = 'There was a problem saving the consultation. Please try again later.';
           setTimeout(() => {
             this.errorMessage = '';
           }, 5000);
         }
       });
   } else {
     this.router.navigate(['/login']);
   }
 }

 // Reset form
 resetForm() {
   this.consultationData = {
     patientId: '',
     patientName: '',
     age: '',
     gender: '',
     phone: '',
     email: '',
     address: '',
     chiefComplaint: '',
     historyOfPresentIllness: '',
     pastMedicalHistory: '',
     currentMedications: '',
     allergies: '',
     bloodPressure: '',
     temperature: '',
     pulse: '',
     respiratoryRate: '',
     oxygenSaturation: '',
     weight: '',
     height: '',
     generalAppearance: '',
     cardiovascular: '',
     respiratory: '',
     abdominal: '',
     neurological: '',
     diagnosis: '',
     treatmentPlan: '',
     medications: '',
     followUpInstructions: '',
     referralNeeded: false,
     referralDepartment: '',
     consultationDate: new Date().toISOString().split('T')[0],
     consultingDoctor: this.getCurrentDoctorName(),
     urgency: 'routine'
   };
   this.activeSection = 'patient-info';
   // Reset all field states when form is reset
   this.initializeFieldStates();
 }

 // Print consultation
 printConsultation() {
   window.print();
 }

 // Initialize field states
 initializeFieldStates() {
   this.fieldStates = {};
   // Also update states for existing field values
   this.refreshFieldStates();
 }

 // Refresh all field states (useful for debugging)
 refreshFieldStates() {
   const allFields = [
     'patientId', 'patientName', 'age', 'gender', 'phone', 'email', 'address',
     'chiefComplaint', 'historyOfPresentIllness', 'pastMedicalHistory',
     'currentMedications', 'allergies', 'bloodPressure', 'temperature',
     'pulse', 'respiratoryRate', 'oxygenSaturation', 'weight', 'height',
     'generalAppearance', 'cardiovascular', 'respiratory', 'abdominal',
     'neurological', 'diagnosis', 'treatmentPlan', 'medications',
     'followUpInstructions', 'referralDepartment', 'urgency'
   ];

   allFields.forEach(field => {
     this.onFieldChange(field);
   });
 }

 // Check if field is filled (not empty)
 isFieldFilled(fieldName: string): boolean {
   const value = this.consultationData[fieldName as keyof typeof this.consultationData];
   return value !== null && value !== undefined && String(value).trim() !== '';
 }

 // Update field state when input changes
 onFieldChange(fieldName: string) {
   this.fieldStates[fieldName] = this.isFieldFilled(fieldName);

   // Debug logging for diagnosis field
   if (fieldName === 'diagnosis') {
     console.log(`Field ${fieldName} changed. New state:`, {
       fieldValue: this.consultationData[fieldName as keyof typeof this.consultationData],
       isFilled: this.fieldStates[fieldName],
       asteriskClass: this.getAsteriskClass(fieldName)
     });
   }
 }

 // Get CSS class for asterisk based on field state
 getAsteriskClass(fieldName: string): string {
   const isFilled = this.fieldStates[fieldName];
   const fieldValue = this.consultationData[fieldName as keyof typeof this.consultationData];

   // Debug logging for diagnosis field
   if (fieldName === 'diagnosis') {
     console.log(`Diagnosis field - State: ${isFilled}, Value: "${fieldValue}"`);
   }

   if (this.fieldStates[fieldName] === undefined) {
     return 'text-red-500'; // Default to red for empty fields
   }
   return this.fieldStates[fieldName] ? 'text-green-500' : 'text-red-500';
 }

 // Check if all required fields in current section are filled
 areRequiredFieldsFilled(section: string): boolean {
   const requiredFields = this.requiredFieldsBySection[section as keyof typeof this.requiredFieldsBySection] || [];
   return requiredFields.every(field => this.isFieldFilled(field));
 }

 // Check if section is valid for navigation
 isSectionValid(section: string): boolean {
   return this.areRequiredFieldsFilled(section);
 }

 // Debug method to check diagnosis field state (can be called from console)
 debugDiagnosisField() {
   console.log('=== DIAGNOSIS FIELD DEBUG ===');
   console.log('Field value:', `"${this.consultationData.diagnosis}"`);
   console.log('Is field filled:', this.isFieldFilled('diagnosis'));
   console.log('Field state:', this.fieldStates['diagnosis']);
   console.log('Asterisk class:', this.getAsteriskClass('diagnosis'));
   console.log('Required fields for treatment:', this.requiredFieldsBySection['treatment']);
   console.log('Treatment section valid:', this.isSectionValid('treatment'));
   console.log('===========================');
   return {
     value: this.consultationData.diagnosis,
     isFilled: this.isFieldFilled('diagnosis'),
     state: this.fieldStates['diagnosis'],
     class: this.getAsteriskClass('diagnosis'),
     sectionValid: this.isSectionValid('treatment')
   };
 }
}
