import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost/login.php';

  // signal to track login state
  public loggedIn = signal<boolean>(!!localStorage.getItem('staff'));

  constructor(private http: HttpClient) {}

  login(staffId: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { staff_id: staffId, password })
      .pipe(
        tap(response => {
          if (response.success) {
            localStorage.setItem('staff', JSON.stringify(response.staff));
            this.loggedIn.set(true);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('staff');
    this.loggedIn.set(false);
  }

  getStaff(): any {
    const staff = localStorage.getItem('staff');
    return staff ? JSON.parse(staff) : null;
  }
}
