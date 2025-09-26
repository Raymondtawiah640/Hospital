import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  menuOpen = false;

  constructor(public auth: Auth, private router: Router) {}

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  get isLoggedIn(): boolean { return this.auth.loggedIn(); }
  get staffName(): string { return this.auth.getStaff()?.full_name || ''; }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
