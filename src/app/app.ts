import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, LoginComponent, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('wms-fe');
  isAuthenticated = false;
  userInfo: UserInfo | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
      });

    // Subscribe to user info
    this.authService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userInfo = user;
      });

    // Check initial auth status
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userInfo = this.authService.getUserInfo();
    }

    // Listen to route changes to check auth
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isAuthenticated = this.authService.isAuthenticated();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout(): void {
    this.authService.logout();
  }

  getUserDisplayName(): string {
    if (this.userInfo) {
      return this.userInfo.name || 
             this.userInfo.preferred_username || 
             this.userInfo.email || 
             'User';
    }
    return 'Admin';
  }
}
