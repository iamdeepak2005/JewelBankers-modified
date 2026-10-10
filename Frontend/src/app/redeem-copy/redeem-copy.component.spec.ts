import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedeemCopyComponent } from './redeem-copy.component';

describe('RedeemCopyComponent', () => {
  let component: RedeemCopyComponent;
  let fixture: ComponentFixture<RedeemCopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedeemCopyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedeemCopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
