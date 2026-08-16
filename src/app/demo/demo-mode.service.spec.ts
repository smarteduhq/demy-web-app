import { TestBed } from '@angular/core/testing';
import { DemoModeService } from './demo-mode.service';

describe('DemoModeService', () => {
  let service: DemoModeService;

  beforeEach(() => {
    sessionStorage.removeItem('demy-demo-mode');
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemoModeService);
  });

  afterEach(() => {
    sessionStorage.removeItem('demy-demo-mode');
  });

  it('enters and exits demo mode while persisting only the mode flag', () => {
    expect(service.isActive()).toBeFalse();

    service.enter();
    expect(service.isActive()).toBeTrue();
    expect(sessionStorage.getItem('demy-demo-mode')).toBe('true');

    service.exit();
    expect(service.isActive()).toBeFalse();
    expect(sessionStorage.getItem('demy-demo-mode')).toBeNull();
  });
});
