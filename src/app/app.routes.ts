import { Routes } from '@angular/router';
import {authenticationGuard} from './iam-user/services/authentication.guard';
import { LoginComponent } from './public/pages/login/login.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authenticationGuard],
    loadComponent: () => import('./shared/components/main-layout/main-layout.component')
      .then((module) => module.MainLayoutComponent),
    children: [
      {
        path: 'organization',
        loadComponent: () => import('./shared/components/organization-layout/organization-layout.component')
          .then((module) => module.OrganizationLayoutComponent)
      },
      {
        path: 'organization/teachers',
        loadComponent: () => import('./iam-user/pages/teacher-overview/teacher-overview.component')
          .then((module) => module.TeacherOverviewComponent)
      },
      {
        path: 'organization/courses',
        loadComponent: () => import('./scheduling/pages/courses-overview/courses-overview.component')
          .then((module) => module.CoursesOverviewComponent)
      },
      {
        path: 'organization/classrooms',
        loadComponent: () => import('./scheduling/pages/classroom-overview/classroom-overview.component')
          .then((module) => module.ClassroomOverviewComponent)
      },
      {
        path: 'organization/academic-periods',
        loadComponent: () => import('./enrollments/pages/academic-period-management/academic-period-management.component')
          .then((module) => module.AcademicPeriodManagementComponent)
      },
      {
        path: 'organization/weekly-schedules',
        loadComponent: () => import('./scheduling/pages/weekly-schedules-overview/weekly-schedules-overview.component')
          .then((module) => module.WeeklySchedulesOverviewComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./billing/pages/payments-layout/payments-layout.component')
          .then((module) => module.PaymentsLayoutComponent),
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: 'list',
            loadComponent: () => import('./billing/pages/payments/payments.component')
              .then((module) => module.PaymentsComponent)
          },
          {
            path: 'assign',
            loadComponent: () => import('./billing/components/invoice-assign/invoice-assign.component')
              .then((module) => module.InvoiceAssignComponent)
          }
        ]
      },
      {
        path: 'attendance',
        loadComponent: () => import('./attendance/pages/attendance-page/attendance-page.component')
          .then((module) => module.AttendancePageComponent)
      },
      {
        path: 'attendance-reports',
        loadComponent: () => import('./attendance/pages/attendance-report-page/attendance-report-page.component')
          .then((module) => module.AttendanceReportPageComponent)
      },
      {
        path: 'finance',
        loadComponent: () => import('./billing/pages/expenses-page/expenses-page.component')
          .then((module) => module.ExpensesPageComponent)
      },
      {
        path: 'search-schedules',
        loadComponent: () => import('./scheduling/pages/search-schedules/search-schedules.component')
          .then((module) => module.SearchSchedulesComponent)
      },
      {
        path: 'my-schedule',
        loadComponent: () => import('./scheduling/pages/teacher-schedule/teacher-schedule.component')
          .then((module) => module.TeacherScheduleComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./enrollments/pages/student-management/student-management.component')
          .then((module) => module.StudentManagementComponent)
      },
      {
        path: 'enrollment',
        loadComponent: () => import('./enrollments/pages/enrollment-page/enrollment-page.component')
          .then((module) => module.EnrollmentPageComponent)
      },
      { path: '', redirectTo: 'organization', pathMatch: 'full' }
    ]
  },
  {
    path: 'demo',
    loadComponent: () => import('./demo/demo-entry.component')
      .then((module) => module.DemoEntryComponent)
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    loadComponent: () => import('./public/pages/sign-up/sign-up.component')
      .then((module) => module.SignUpComponent)
  },
  {
    path: 'planSelect',
    loadComponent: () => import('./public/pages/plan-select/plan-select.component')
      .then((module) => module.PlanSelectComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./public/pages/reset-password/reset-password.component')
      .then((module) => module.ResetPasswordComponent)
  },
  {
    path: 'payment',
    loadComponent: () => import('./public/pages/payment-pages/payment-pages.component')
      .then((module) => module.PaymentPagesComponent)
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
