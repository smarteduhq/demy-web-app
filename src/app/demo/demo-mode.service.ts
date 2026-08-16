import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const DEMO_MODE_KEY = 'demy-demo-mode';

@Injectable({ providedIn: 'root' })
export class DemoModeService {
  private readonly activeSubject = new BehaviorSubject<boolean>(this.readActiveState());

  readonly isActive$ = this.activeSubject.asObservable();

  isActive(): boolean {
    return this.activeSubject.value;
  }

  enter(): void {
    this.writeActiveState(true);
    this.activeSubject.next(true);
  }

  exit(): void {
    this.writeActiveState(false);
    this.activeSubject.next(false);
  }

  private readActiveState(): boolean {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DEMO_MODE_KEY) === 'true';
  }

  private writeActiveState(active: boolean): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    if (active) {
      sessionStorage.setItem(DEMO_MODE_KEY, 'true');
    } else {
      sessionStorage.removeItem(DEMO_MODE_KEY);
    }
  }
}
