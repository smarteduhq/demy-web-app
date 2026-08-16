import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DemoRoutePreloaderService {
  preloadDemoShell(): void {
    void Promise.all([
      import('../shared/components/main-layout/main-layout.component'),
      import('../shared/components/organization-layout/organization-layout.component')
    ]);
  }

  preloadDemoSidebarRoutes(): void {
    void Promise.all([
      import('../enrollments/pages/enrollment-page/enrollment-page.component'),
      import('../enrollments/pages/student-management/student-management.component'),
      import('../billing/pages/payments-layout/payments-layout.component'),
      import('../billing/pages/payments/payments.component'),
      import('../scheduling/pages/search-schedules/search-schedules.component'),
      import('../billing/pages/expenses-page/expenses-page.component')
    ]);
  }
}
