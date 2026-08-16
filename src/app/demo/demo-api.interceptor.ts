import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { DemoDataStore } from './demo-data-store';
import { DemoModeService } from './demo-mode.service';

export const demoApiInterceptor: HttpInterceptorFn = (request, next) => {
  const demoMode = inject(DemoModeService);

  if (!demoMode.isActive() || !isDemoApiRequest(request.url)) {
    return next(request);
  }

  return inject(DemoDataStore).handle(request);
};

function isDemoApiRequest(url: string): boolean {
  return url === environment.apiBaseUrl || url.startsWith(environment.apiBaseUrl + '/');
}
