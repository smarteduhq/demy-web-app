import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';

export interface DemoRecord {
  id?: number | string | null;
  [key: string]: unknown;
}

export interface DemoDatabase {
  users: DemoRecord[];
  academies: DemoRecord[];
  academicPeriods: DemoRecord[];
  students: DemoRecord[];
  enrollments: DemoRecord[];
  courses: DemoRecord[];
  classrooms: DemoRecord[];
  weeklySchedules: DemoRecord[];
  invoices: DemoRecord[];
  payments: DemoRecord[];
  financialTransactions: DemoRecord[];
}

type DemoCollection = keyof DemoDatabase;

@Injectable({ providedIn: 'root' })
export class DemoDataStore {
  private readonly http = inject(HttpClient);
  private database: DemoDatabase | null = null;

  private readonly initialDatabase$ = this.http
    .get<DemoDatabase>('/assets/demo/db.json')
    .pipe(
      map(database => this.clone(database)),
      tap(database => this.database = database),
      shareReplay({ bufferSize: 1, refCount: false })
    );

  handle(request: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
    return this.initialDatabase$.pipe(
      map(() => this.dispatch(request))
    );
  }

  private dispatch(request: HttpRequest<unknown>): HttpResponse<unknown> {
    const { segments, query } = this.parseUrl(request.url);

    if (segments[0] === 'students' && segments[2] === 'invoices') {
      return this.handleStudentInvoices(request, segments[1]);
    }

    if (segments[0] === 'students' && segments[1] === 'dni') {
      return this.handleStudentByDni(request, segments[2]);
    }

    if (segments[0] === 'enrollments' && segments[1] === 'student') {
      return this.handleEnrollmentsByStudent(request, segments[2]);
    }

    if (segments[0] === 'weekly-schedules') {
      return this.handleWeeklySchedules(request, segments);
    }

    if (segments[0] === 'financial-transactions' && segments.length > 1) {
      return this.handleFinancialTransaction(request, segments);
    }

    if (segments[0] === 'users') {
      return this.handleUsers(request, segments, query);
    }

    const collection = this.collectionFor(segments[0]);
    if (collection) {
      return this.handleCollection(request, collection, segments.slice(1), query);
    }

    throw this.notFound(request, 'Demo endpoint not found: ' + request.method + ' ' + request.url);
  }

  private handleUsers(
    request: HttpRequest<unknown>,
    segments: string[],
    query: URLSearchParams
  ): HttpResponse<unknown> {
    const users = this.records('users');

    if (segments[1] === 'teachers') {
      const teachers = users.filter(user => user['role'] === 'TEACHER');

      if (segments.length === 2 && request.method === 'GET') {
        return this.ok(teachers);
      }

      if (segments.length === 2 && request.method === 'POST') {
        return this.createRecord(users, request, { role: 'TEACHER', status: 'ACTIVE' });
      }

      if (segments.length === 3) {
        return this.handleRecord(request, teachers, segments[2], users);
      }
    }

    if (segments.length === 2 && request.method === 'GET') {
      const user = this.findById(users, segments[1]);
      if (!user) {
        throw this.notFound(request, 'User ' + segments[1] + ' not found');
      }
      return this.ok({ message: 'User found', user });
    }

    return this.handleCollection(request, 'users', segments.slice(1), query);
  }

  private handleStudentByDni(
    request: HttpRequest<unknown>,
    dni: string
  ): HttpResponse<unknown> {
    const decodedDni = decodeURIComponent(dni);
    const student = this.records('students').find(item => item['dni'] === decodedDni);

    if (!student) {
      throw this.notFound(request, 'Student with DNI ' + decodedDni + ' not found');
    }

    return this.ok(student);
  }

  private handleStudentInvoices(
    request: HttpRequest<unknown>,
    dni: string
  ): HttpResponse<unknown> {
    const decodedDni = decodeURIComponent(dni);
    const student = this.records('students').find(item => item['dni'] === decodedDni);

    if (!student) {
      throw this.notFound(request, 'Student with DNI ' + decodedDni + ' not found');
    }

    const invoices = this.records('invoices');

    if (request.method === 'GET') {
      return this.ok(invoices.filter(invoice => invoice['dni'] === decodedDni));
    }

    if (request.method === 'POST') {
      const body = this.readBody(request);
      const invoice = this.createRecordValue(invoices, {
        ...body,
        dni: decodedDni,
        name: String(student['firstName'] ?? '') + ' ' + String(student['lastName'] ?? ''),
        status: body['status'] ?? 'PENDING'
      });
      invoices.push(invoice);
      return this.ok(invoice, 201);
    }

    throw this.notFound(request, 'Invoice endpoint not found: ' + request.method + ' ' + request.url);
  }

  private handleEnrollmentsByStudent(
    request: HttpRequest<unknown>,
    studentId: string
  ): HttpResponse<unknown> {
    if (request.method !== 'GET') {
      throw this.notFound(request, 'Enrollment endpoint not found: ' + request.method + ' ' + request.url);
    }

    const enrollments = this.records('enrollments')
      .filter(enrollment => String(enrollment['studentId']) === studentId);
    return this.ok(enrollments);
  }

  private handleWeeklySchedules(
    request: HttpRequest<unknown>,
    segments: string[]
  ): HttpResponse<unknown> {
    const schedules = this.records('weeklySchedules');

    if (segments[1] === 'by-teacher' && request.method === 'GET') {
      const teacherId = segments[2];
      const matchingSchedules = schedules.flatMap(weekly => {
        const items = this.asRecords(weekly['schedules']);
        return items
          .filter(schedule => String(this.getNestedId(schedule, 'teacher')) === teacherId)
          .map(schedule => this.enrichSchedule(schedule));
      });
      return this.ok(matchingSchedules);
    }

    if (segments[1] === 'schedules' && segments.length === 3 && request.method === 'PUT') {
      const scheduleId = segments[2];
      for (const weekly of schedules) {
        const items = this.asRecords(weekly['schedules']);
        const index = items.findIndex(item => String(item['id']) === scheduleId);
        if (index >= 0) {
          const updated = this.enrichSchedule({
            ...items[index],
            ...this.readBody(request),
            id: items[index]['id']
          });
          items[index] = updated;
          weekly['schedules'] = items;
          return this.ok(updated);
        }
      }
      throw this.notFound(request, 'Schedule ' + scheduleId + ' not found');
    }

    if (segments.length === 3 && segments[2] === 'schedules') {
      const weekly = this.findById(schedules, segments[1]);
      if (!weekly) {
        throw this.notFound(request, 'Weekly schedule ' + segments[1] + ' not found');
      }

      const items = this.asRecords(weekly['schedules']);

      if (request.method === 'POST') {
        const schedule = this.enrichSchedule(this.createRecordValue(items, this.readBody(request)));
        items.push(schedule);
        weekly['schedules'] = items;
        return this.ok(weekly, 201);
      }
    }

    if (segments.length === 4 && segments[2] === 'schedules' && request.method === 'DELETE') {
      const weekly = this.findById(schedules, segments[1]);
      if (!weekly) {
        throw this.notFound(request, 'Weekly schedule ' + segments[1] + ' not found');
      }

      const items = this.asRecords(weekly['schedules']);
      weekly['schedules'] = items.filter(item => String(item['id']) !== segments[3]);
      return this.empty();
    }

    return this.handleCollection(
      request,
      'weeklySchedules',
      segments.slice(1),
      new URL(request.url).searchParams
    );
  }

  private handleFinancialTransaction(
    request: HttpRequest<unknown>,
    segments: string[]
  ): HttpResponse<unknown> {
    const transactions = this.records('financialTransactions');

    if (
      segments[1] === 'invoices' &&
      segments[3] === 'payment' &&
      request.method === 'POST'
    ) {
      const invoice = this.findById(this.records('invoices'), segments[2]);
      if (!invoice) {
        throw this.notFound(request, 'Invoice ' + segments[2] + ' not found');
      }

      const body = this.readBody(request);
      invoice['status'] = 'PAID';
      const payment = {
        id: this.nextId(this.records('payments')),
        invoiceId: invoice['id'],
        amount: invoice['amount'],
        currency: invoice['currency'] ?? 'PEN',
        method: body['method'] ?? 'OTHER',
        paidAt: new Date().toISOString()
      };
      this.records('payments').push(payment);

      const transaction = this.createRecordValue(transactions, {
        type: 'INCOME',
        category: 'Matrícula',
        concept: 'Pago de factura #' + invoice['id'],
        date: new Date().toISOString(),
        payment
      });
      transactions.push(transaction);
      return this.ok({ ...transaction, payment });
    }

    if (segments[1] === 'expenses' && request.method === 'POST') {
      const body = this.readBody(request);
      const transactionDate = body['date'] ?? body['paidAt'] ?? new Date().toISOString();
      const transaction = this.createRecordValue(transactions, {
        category: body['category'],
        concept: body['concept'],
        type: 'EXPENSE',
        date: transactionDate,
        payment: {
          amount: Number(body['amount'] ?? 0),
          currency: body['currency'] ?? 'PEN',
          method: body['method'] ?? 'OTHER',
          paidAt: body['paidAt'] ?? transactionDate
        }
      });
      transactions.push(transaction);
      return this.ok(transaction, 201);
    }

    throw this.notFound(request, 'Financial endpoint not found: ' + request.method + ' ' + request.url);
  }

  private handleCollection(
    request: HttpRequest<unknown>,
    collection: DemoCollection,
    segments: string[],
    query: URLSearchParams
  ): HttpResponse<unknown> {
    const records = this.records(collection);

    if (segments.length === 0 && request.method === 'GET') {
      return this.ok(this.filterRecords(records, query));
    }

    if (segments.length === 0 && request.method === 'POST') {
      return this.createRecord(records, request);
    }

    if (segments.length === 1) {
      return this.handleRecord(request, records, segments[0], records);
    }

    throw this.notFound(request, 'Collection endpoint not found: ' + request.method + ' ' + request.url);
  }

  private handleRecord(
    request: HttpRequest<unknown>,
    visibleRecords: DemoRecord[],
    id: string,
    backingRecords: DemoRecord[]
  ): HttpResponse<unknown> {
    const record = visibleRecords.find(item => String(item['id']) === id);
    if (!record) {
      throw this.notFound(request, 'Record ' + id + ' not found');
    }

    if (request.method === 'GET') {
      return this.ok(record);
    }

    const backingIndex = backingRecords.indexOf(record);

    if (request.method === 'PUT') {
      const updated = {
        ...record,
        ...this.readBody(request),
        id: record['id']
      };
      backingRecords[backingIndex] = updated;
      return this.ok(updated);
    }

    if (request.method === 'DELETE') {
      backingRecords.splice(backingIndex, 1);
      return this.empty();
    }

    throw this.notFound(request, 'Record operation not found: ' + request.method + ' ' + request.url);
  }

  private createRecord(
    records: DemoRecord[],
    request: HttpRequest<unknown>,
    defaults: DemoRecord = {}
  ): HttpResponse<unknown> {
    const record = this.createRecordValue(records, { ...defaults, ...this.readBody(request) });
    records.push(record);
    return this.ok(record, 201);
  }

  private createRecordValue(records: DemoRecord[], value: DemoRecord): DemoRecord {
    return {
      ...this.clone(value),
      id: value['id'] ?? this.nextId(records)
    };
  }

  private filterRecords(records: DemoRecord[], query: URLSearchParams): DemoRecord[] {
    const email = query.get('email');
    const userId = query.get('userId');
    const dni = query.get('dni');

    return records.filter(record => {
      const emailMatches = !email || record['email'] === email;
      const userMatches = !userId || String(record['userId']) === userId;
      const dniMatches = !dni || record['dni'] === dni;
      return emailMatches && userMatches && dniMatches;
    });
  }

  private collectionFor(segment: string | undefined): DemoCollection | null {
    const collections: Record<string, DemoCollection> = {
      academies: 'academies',
      'academic-periods': 'academicPeriods',
      classrooms: 'classrooms',
      courses: 'courses',
      enrollments: 'enrollments',
      invoices: 'invoices',
      payments: 'payments',
      students: 'students',
      'financial-transactions': 'financialTransactions',
      'weekly-schedules': 'weeklySchedules'
    };
    return segment ? collections[segment] ?? null : null;
  }

  private records(collection: DemoCollection): DemoRecord[] {
    if (!this.database) {
      throw new Error('Demo database has not been loaded');
    }
    return this.database[collection];
  }

  private findById(records: DemoRecord[], id: string): DemoRecord | undefined {
    return records.find(record => String(record['id']) === id);
  }

  private nextId(records: DemoRecord[]): number {
    return records.reduce((max, record) => {
      const id = Number(record['id']);
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0) + 1;
  }

  private enrichSchedule(schedule: DemoRecord): DemoRecord {
    const courseId = this.getNestedId(schedule, 'course');
    const classroomId = this.getNestedId(schedule, 'classroom');
    const teacherId = this.getNestedId(schedule, 'teacher');
    const course = this.findById(this.records('courses'), String(courseId));
    const classroom = this.findById(this.records('classrooms'), String(classroomId));
    const teacher = this.findById(this.records('users'), String(teacherId));
    const timeRange = this.asRecord(schedule['timeRange']);
    const start = String(schedule['startTime'] ?? timeRange['start'] ?? '');
    const end = String(schedule['endTime'] ?? timeRange['end'] ?? '');

    return {
      ...this.clone(schedule),
      courseId,
      classroomId,
      teacherId,
      startTime: start,
      endTime: end,
      timeRange: { start, end },
      course: course ?? schedule['course'],
      classroom: classroom ?? schedule['classroom'],
      teacher: teacher ?? schedule['teacher']
    };
  }

  private getNestedId(record: DemoRecord, key: string): number | string | undefined {
    const direct = record[key + 'Id'];
    if (typeof direct === 'number' || typeof direct === 'string') {
      return direct;
    }

    const nested = this.asRecord(record[key]);
    const nestedId = nested['id'];
    return typeof nestedId === 'number' || typeof nestedId === 'string' ? nestedId : undefined;
  }

  private asRecords(value: unknown): DemoRecord[] {
    return Array.isArray(value) ? value.filter(this.isRecord) : [];
  }

  private asRecord(value: unknown): DemoRecord {
    return this.isRecord(value) ? value : {};
  }

  private isRecord(value: unknown): value is DemoRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private readBody(request: HttpRequest<unknown>): DemoRecord {
    if (typeof request.body === 'string') {
      try {
        const parsed: unknown = JSON.parse(request.body);
        return this.asRecord(parsed);
      } catch {
        return {};
      }
    }
    return this.asRecord(request.body);
  }

  private parseUrl(url: string): { segments: string[]; query: URLSearchParams } {
    const parsed = new URL(url, window.location.origin);
    const base = new URL('/api/v1', window.location.origin);
    const path = parsed.pathname.startsWith(base.pathname)
      ? parsed.pathname.slice(base.pathname.length)
      : parsed.pathname;
    return {
      segments: path.split('/').filter(Boolean).map(segment => decodeURIComponent(segment)),
      query: parsed.searchParams
    };
  }

  private ok(body: unknown, status = 200): HttpResponse<unknown> {
    return new HttpResponse({
      status,
      body: this.clone(body),
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  private empty(): HttpResponse<unknown> {
    return new HttpResponse({ status: 204 });
  }

  private notFound(request: HttpRequest<unknown>, message: string): HttpErrorResponse {
    return new HttpErrorResponse({
      error: { message },
      status: 404,
      statusText: 'Not Found',
      url: request.url
    });
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
