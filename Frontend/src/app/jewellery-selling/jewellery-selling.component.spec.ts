import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewellerySellingComponent } from './jewellery-selling.component';

describe('JewellerySellingComponent', () => {
  let component: JewellerySellingComponent;
  let fixture: ComponentFixture<JewellerySellingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewellerySellingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewellerySellingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
