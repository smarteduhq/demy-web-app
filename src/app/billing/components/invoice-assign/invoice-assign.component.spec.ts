import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceAssignComponent } from './invoice-assign.component';

describe('InvoiceAssignComponentComponent', () => {
  let component: InvoiceAssignComponent;
  let fixture: ComponentFixture<InvoiceAssignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceAssignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceAssignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
