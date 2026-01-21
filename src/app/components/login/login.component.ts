import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import './login.component.css';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  isLoading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Nếu đã đăng nhập, redirect đến dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin(): void {
    this.isLoading = true;
    this.error = null;
    
    try {
      this.authService.login();
    } catch (err: any) {
      this.error = err.message || 'Đã xảy ra lỗi khi đăng nhập';
      this.isLoading = false;
    }
  }

  // Method để test với mock login (khi chưa có OIDC provider)
  onMockLogin(): void {
    this.isLoading = true;
    this.error = null;
    
    // Simulate login delay
    setTimeout(() => {
      // Mock user info
      const mockUser = {
        sub: 'mock-user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        preferred_username: 'admin'
      };
      
      // Note: Trong thực tế, bạn sẽ cần cập nhật auth service để hỗ trợ mock mode
      // Hoặc sử dụng một OIDC provider test như Keycloak local
      console.log('Mock login - Cần cấu hình OIDC provider thật để đăng nhập');
      this.error = 'Vui lòng cấu hình OIDC provider để đăng nhập. Xem hướng dẫn trong auth.service.ts';
      this.isLoading = false;
    }, 1000);
  }
}

