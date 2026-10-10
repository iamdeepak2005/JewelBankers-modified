import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerCopyComponent } from './customer-copy.component';

describe('CustomerCopyComponent', () => {
  let component: CustomerCopyComponent;
  let fixture: ComponentFixture<CustomerCopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCopyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerCopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
