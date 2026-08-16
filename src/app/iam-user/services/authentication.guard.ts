import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthenticationService} from "./authentication.service";
import {DemoModeService} from "../../demo/demo-mode.service";
import {map, take} from "rxjs";

/**
 * Guard for checking if the user is signed in.
 *
 * @summary
 * This guard verifies if the user is authenticated by checking the `isSignedIn` observable from
 * {@link AuthenticationService}. If the user is signed in, navigation proceeds. Otherwise,
 * the user is redirected to the login page.
 *
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns A boolean or an Observable<boolean> indicating whether navigation is allowed
 */
export const authenticationGuard: CanActivateFn = (route,
                                                   state) => {
  const authenticationService = inject(AuthenticationService);
  const demoMode = inject(DemoModeService);
  const router = inject(Router);
  /**
   * Check the `isSignedIn` status and decide whether to allow access or redirect.
   */
  return authenticationService.isSignedIn.pipe(take(1), map(isSignedIn => {
    if (isSignedIn || demoMode.isActive()) return true;
    else {
      router.navigate(['/login']).then();
      return false;
    }
  }));
};
