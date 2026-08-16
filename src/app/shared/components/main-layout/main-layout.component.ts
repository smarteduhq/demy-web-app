import { Component, signal } from '@angular/core';
import { HeaderContentComponent } from '../header-content/header-content.component';
import { SideNavigationBarComponent } from '../side-navigation-bar/side-navigation-bar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {Router, RouterOutlet} from '@angular/router';
import { ContentWrapperComponent } from '../content-wrapper/content-wrapper.component';
import { AuthenticationService } from '../../../iam-user/services/authentication.service';
import { DemoBannerComponent } from '../demo-banner/demo-banner.component';

/**
 * Main layout component that integrates all structural elements including header,
 * sidebar and routed content. Handles responsive layout detection and global actions.
 *
 * @example
 * <app-main-layout></app-main-layout>
 */
@Component({
  selector: 'app-main-layout',
  imports: [
    HeaderContentComponent,
    SideNavigationBarComponent,
    MatSidenavModule,
    RouterOutlet,
    ContentWrapperComponent,
    DemoBannerComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  /**
   * Signal indicating if the application is in mobile view.
   * Updates automatically when screen size changes.
   */
  readonly isMobile = signal<boolean>(false);

  constructor(private observer: BreakpointObserver,
              private authService: AuthenticationService,
              private router: Router) {
    this.observer.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  logout() {
    // lógica para cerrar sesión (vaciar token, redirigir, etc.)
    this.authService.signOut();
  }
}
