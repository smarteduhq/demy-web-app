import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam-user/services/authentication.service';
import { DemoModeService } from '../../../demo/demo-mode.service';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatIcon, TranslatePipe],
  templateUrl: './demo-banner.component.html',
  styleUrl: './demo-banner.component.css'
})
export class DemoBannerComponent {
  readonly isActive$ = inject(DemoModeService).isActive$;
  private readonly authenticationService = inject(AuthenticationService);

  exit(): void {
    this.authenticationService.signOut();
  }
}
