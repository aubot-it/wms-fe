import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import './dashboard.component.css';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1 class="dashboard__title">{{ getPageTitle() }}</h1>
      <div class="dashboard__content">
        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi__label">Đơn hôm nay</div>
            <div class="kpi__value">128</div>
            <div class="kpi__sub">+12% so với hôm qua</div>
          </div>
          <div class="kpi">
            <div class="kpi__label">Tồn kho</div>
            <div class="kpi__value">42,860</div>
            <div class="kpi__sub">SKU đang hoạt động</div>
          </div>
          <div class="kpi">
            <div class="kpi__label">Tỉ lệ hoàn thành</div>
            <div class="kpi__value">96.4%</div>
            <div class="kpi__sub">SLA 24h</div>
          </div>
        </div>

        <div class="chart-grid">
          <div class="chart-card">
            <div class="chart-card__header">
              <div class="chart-card__title">Lưu lượng đơn (7 ngày)</div>
              <div class="chart-card__meta">Mock data</div>
            </div>
            <div class="bar-chart" aria-label="Biểu đồ cột lưu lượng đơn 7 ngày">
              <div class="bar" style="--h: 42%"><span>T2</span></div>
              <div class="bar" style="--h: 58%"><span>T3</span></div>
              <div class="bar" style="--h: 65%"><span>T4</span></div>
              <div class="bar" style="--h: 54%"><span>T5</span></div>
              <div class="bar" style="--h: 78%"><span>T6</span></div>
              <div class="bar" style="--h: 62%"><span>T7</span></div>
              <div class="bar" style="--h: 88%"><span>CN</span></div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-card__header">
              <div class="chart-card__title">Tình trạng đơn</div>
              <div class="chart-card__meta">Mock data</div>
            </div>
            <div class="donut-wrap" aria-label="Biểu đồ donut tình trạng đơn">
              <div class="donut" style="--p1: 62; --p2: 24; --p3: 14"></div>
              <div class="donut-legend">
                <div class="legend-row"><span class="dot dot--a"></span><span>Hoàn thành</span><b>62%</b></div>
                <div class="legend-row"><span class="dot dot--b"></span><span>Đang xử lý</span><b>24%</b></div>
                <div class="legend-row"><span class="dot dot--c"></span><span>Lỗi</span><b>14%</b></div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-card__header">
              <div class="chart-card__title">Throughput (giờ)</div>
              <div class="chart-card__meta">Mock data</div>
            </div>
            <div class="sparkline">
              <svg viewBox="0 0 120 40" role="img" aria-label="Sparkline throughput">
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"></stop>
                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <path class="sparkline__area" d="M0,34 L10,30 L20,26 L30,28 L40,22 L50,18 L60,20 L70,14 L80,16 L90,10 L100,12 L110,6 L120,8 L120,40 L0,40 Z"></path>
                <path class="sparkline__line" d="M0,34 L10,30 L20,26 L30,28 L40,22 L50,18 L60,20 L70,14 L80,16 L90,10 L100,12 L110,6 L120,8"></path>
                <circle class="sparkline__dot" cx="120" cy="8" r="2.5"></circle>
              </svg>
              <div class="sparkline__stats">
                <div class="stat">
                  <div class="stat__label">Hiện tại</div>
                  <div class="stat__value">86</div>
                </div>
                <div class="stat">
                  <div class="stat__label">Đỉnh</div>
                  <div class="stat__value">102</div>
                </div>
                <div class="stat">
                  <div class="stat__label">TB</div>
                  <div class="stat__value">74</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h2>Thông tin đăng nhập</h2>
          @if (userInfo) {
            <div class="user-info">
              <p><strong>Name:</strong> {{ (userInfo.info?.name ?? userInfo.name) || 'N/A' }}</p>
              <p><strong>Email:</strong> {{ (userInfo.info?.email ?? userInfo.email) || 'N/A' }}</p>
              <p><strong>Username:</strong> {{ (userInfo.info?.preferred_username ?? userInfo.preferred_username) || 'N/A' }}</p>
              <p><strong>User ID:</strong> {{ (userInfo.info?.sub ?? userInfo.sub) || 'N/A' }}</p>
            </div>
          } @else {
            <p>Đang tải thông tin người dùng...</p>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  userInfo: any = null;
  currentRoute = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.currentRoute = this.router.url;
    
    // Get user info
    this.authService.userInfo$.subscribe(user => {
      this.userInfo = user;
    });
    
    this.userInfo = this.authService.getUserInfo();
  }

  getPageTitle(): string {
    const route = this.router.url;
    if (route.includes('/orders')) return 'Đơn hàng';
    if (route.includes('/warehouse')) return 'Kho';
    if (route.includes('/settings')) return 'Cài đặt';
    return 'Tổng quan';
  }
}

