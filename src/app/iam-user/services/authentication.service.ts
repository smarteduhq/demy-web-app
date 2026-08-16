import {inject, Injectable} from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {BehaviorSubject, Observable} from "rxjs";
import {Router} from "@angular/router";
import {SignUpRequest} from "../model/sign-up.request";
import {SignUpResponse} from "../model/sign-up.response";
import {SignInRequest} from "../model/sign-in.request";
import {SignInResponse} from "../model/sign-in.response";
import { NotificationService } from '../../shared/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { DemoModeService } from '../../demo/demo-mode.service';

/**
 * Service for handling authentication operations.
 *
 * @summary
 * This service is responsible for managing user authentication, including sign-up, sign-in,
 * token management, user session state, and routing based on user roles.
 */
@Injectable({providedIn: 'root'})
export class AuthenticationService {
  /** path for API requests */
  basePath: string = `${environment.apiBaseUrl}`;
  private adminSignUpUrl = `${environment.apiBaseUrl}${environment.usersEndpointPath}${environment.adminsEndpointPath}${environment.adminSignUpPath}`;
  private signInUrl = `${environment.apiBaseUrl}${environment.usersEndpointPath}${environment.signInPath}`;


  /** Default HTTP headers for JSON content */
  httpOptions = {headers: new HttpHeaders({'Content-Type': 'application/json'})};

  /** Reactive state for signed-in status */
  private signedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  /** Reactive state for current signed-in user ID */
  private signedInUserId: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  /** Reactive state for current signed-in username */
  private signedInUsername: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private notification = inject(NotificationService);
  private translate = inject(TranslateService);
  private readonly demoMode = inject(DemoModeService);


  /**
   * Constructor for the AuthenticationService.
   *
   * @param router - Angular Router used for navigation
   * @param http - Angular HttpClient for performing HTTP requests
   */
  constructor(private router: Router, private http: HttpClient) {
    const token = localStorage.getItem('token');
    const demoActive = this.demoMode.isActive();
    this.signedIn.next(!!token || demoActive);
    if (demoActive) {
      this.signedInUsername.next('Administrador demo');
    }

    this.demoMode.isActive$.subscribe(active => {
      if (active) {
        this.signedIn.next(true);
        this.signedInUserId.next(0);
        this.signedInUsername.next('Administrador demo');
      } else if (!localStorage.getItem('token')) {
        this.signedIn.next(false);
        this.signedInUserId.next(0);
        this.signedInUsername.next('');
      }
    });
  }
  /** Observable for monitoring sign-in state */
  get isSignedIn() {
    return this.signedIn.asObservable();
  }
  /** Observable for retrieving the signed-in user ID */
  get currentUserId() {
    return this.signedInUserId.asObservable();
  }
  /** Observable for retrieving the signed-in username */
  get currentUsername() {
    return this.signedInUsername.asObservable();
  }
  /**
   * Signs in a user with the provided credentials.
   *
   * @summary
   * Sends a POST request with the user's credentials. On success, stores the token and user data,
   * updates local state, and redirects to the appropriate page based on role. On failure, shows
   * an error message and redirects to the sign-in page.
   *
   * @param signInRequest - The {@link SignInRequest} object containing the username and password
   * @returns A subscription that handles login logic on response
   */

  signIn(signInRequest: SignInRequest) {

    return this.http.post<SignInResponse>(this.signInUrl, signInRequest, this.httpOptions)
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);

          this.signedIn.next(true);
          this.signedInUserId.next(response.user.id);
          this.signedInUsername.next(response.user.username);

          localStorage.setItem('userData', JSON.stringify({
            email: response.user.email,
            role: response.user.role
          }));

          if (response.user.role === 'TEACHER') {
            localStorage.setItem('teacherId', response.user.id.toString());
          }

          this.translate.get('login.success').subscribe(message => {
            this.notification.showSuccess(message);
          });

          switch(response.user.role) {
            case 'ADMIN':
              this.router.navigate(['/organization']).then();
              break;
            case 'TEACHER':
              this.router.navigate(['/attendance']).then();
              break;
            default:
              this.translate.get('login.no-permission').subscribe(message => {
                this.notification.showError(message);
              });
              this.router.navigate(['/sign-in']).then();
          }
        },
        error: (error) => {
          console.error('Sign-in error:', error);

          this.signedIn.next(false);
          this.signedInUserId.next(0);
          this.signedInUsername.next('');

          this.translate.get('login.error').subscribe(message => {
            this.notification.showError(message);
          });

          this.router.navigate(['/sign-in']).then();
        }
      });
  }

  /**
   * Signs out the current user.
   *
   * @summary
   * Clears session-related data (token, ID, username) and navigates to the login page.
   */
  signOut() {
    const wasDemo = this.demoMode.isActive();
    if (wasDemo) {
      this.demoMode.exit();
    }

    this.signedIn.next(false);
    this.signedInUserId.next(0);
    this.signedInUsername.next('');
    if (!wasDemo) {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']).then();
  }

  /**
   * Registers a new user and returns the full server response.
   *
   * @summary
   * Sends a POST request to register a new admin user with the provided sign-up data.
   *
   * @param signUpRequest - The {@link SignUpRequest} object containing registration info
   * @returns An Observable that emits a {@link SignUpResponse} object on success
   */
  signUpWithResponse(signUpRequest: SignUpRequest): Observable<SignUpResponse> {
    const url = `${environment.apiBaseUrl}${environment.usersEndpointPath}${environment.adminsEndpointPath}${environment.adminSignUpPath}`;

    return this.http.post<SignUpResponse>(this.adminSignUpUrl, signUpRequest, this.httpOptions);

  }
}
