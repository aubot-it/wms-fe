import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

export interface UserInfo {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cfg = inject(APP_CONFIG);

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private userInfoSubject = new BehaviorSubject<UserInfo | null>(null);
  public userInfo$ = this.userInfoSubject.asObservable();

  // OIDC Configuration - loaded from runtime config (ENV variables)
  private authConfig: AuthConfig = {
    issuer: '',
    redirectUri: '',
    clientId: 'angular-client',

    // Response type
    responseType: 'code',

    // Scope
    scope: 'openid profile email',

    showDebugInformation: false,
    requireHttps: true,

    // Disable PKCE (nếu provider không hỗ trợ)
    disablePKCE: false,

    // Silent refresh
    silentRefreshRedirectUri: '',
    useSilentRefresh: true,

    // Custom parameters
    customQueryParams: {}
  };

  constructor(
    private oauthService: OAuthService,
    private router: Router
  ) {
    // SSR-safe: chỉ khởi tạo OIDC trên browser
    if (isPlatformBrowser(this.platformId)) {
      this.authConfig.issuer = this.cfg.oidc.issuer;
      this.authConfig.clientId = this.cfg.oidc.clientId;
      this.authConfig.requireHttps = this.cfg.oidc.requireHttps ?? true;
      this.authConfig.showDebugInformation = this.cfg.oidc.showDebugInformation ?? false;

      this.authConfig.redirectUri = window.location.origin + '/dashboard';
      this.authConfig.silentRefreshRedirectUri = window.location.origin + '/silent-refresh.html';
      this.configureOAuth();
      this.checkAuthStatus();
    }
  }

  private configureOAuth(): void {
    if (!this.authConfig.issuer) {
      // Config not provided (e.g., deployment without OIDC). Do not init login flow.
      this.isAuthenticatedSubject.next(false);
      return;
    }
    this.oauthService.configure(this.authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      this.checkAuthStatus();
    });

    // Lắng nghe sự kiện token nhận được
    this.oauthService.events.subscribe(event => {
      if (event.type === 'token_received') {
        this.loadUserProfile();
      }
    });
  }

  private checkAuthStatus(): void {
    const isAuthenticated = this.oauthService.hasValidAccessToken();
    this.isAuthenticatedSubject.next(isAuthenticated);

    if (isAuthenticated) {
      this.loadUserProfile();
    }
  }

  private loadUserProfile(): void {
    this.oauthService.loadUserProfile().then((profile: any) => {
      this.userInfoSubject.next(profile);
    }).catch((error) => {
      console.error('Error loading user profile:', error);
    });
  }

  login(): void {
    // Redirect đến OIDC provider để đăng nhập
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.oauthService.logOut();
    }
    this.isAuthenticatedSubject.next(false);
    this.userInfoSubject.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return this.oauthService.getAccessToken();
  }

  getIdToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return this.oauthService.getIdToken();
  }

  getUserInfo(): UserInfo | null {
    return this.userInfoSubject.value;
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return this.oauthService.hasValidAccessToken();
  }

  // Method để cập nhật cấu hình OIDC (dùng khi có backend)
  updateAuthConfig(config: Partial<AuthConfig>): void {
    this.authConfig = { ...this.authConfig, ...config };
    if (isPlatformBrowser(this.platformId)) {
      this.oauthService.configure(this.authConfig);
    }
  }
}

