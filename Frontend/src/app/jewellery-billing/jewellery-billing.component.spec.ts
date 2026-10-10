import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewelleryBillingComponent } from './jewellery-billing.component';

describe('JewelleryBillingComponent', () => {
  let component: JewelleryBillingComponent;
  let fixture: ComponentFixture<JewelleryBillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewelleryBillingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewelleryBillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
