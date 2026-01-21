import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // OIDC callback: Keycloak sẽ redirect về redirectUri kèm ?code=...&state=...
  // Nếu guard chặn ở đây thì OAuthService không kịp xử lý code để đổi token.
  // Vì vậy, cho phép đi qua để AuthService/OAuthService hoàn tất login.
  const url = state.url || '';
  if (url.includes('code=') || url.includes('state=') || url.includes('error=')) {
    return true;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Lưu URL hiện tại để redirect sau khi đăng nhập
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  
  return false;
};

