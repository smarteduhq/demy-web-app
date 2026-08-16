import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DemoModeService } from './demo-mode.service';

@Component({
  selector: 'app-demo-entry',
  standalone: true,
  template: ''
})
export class DemoEntryComponent implements OnInit {
  private readonly demoMode = inject(DemoModeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.demoMode.enter();
    void this.router.navigate(['/organization'], { replaceUrl: true });
  }
}
