import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewelleryHeaderComponent } from './jewellery-header.component';

describe('JewelleryHeaderComponent', () => {
  let component: JewelleryHeaderComponent;
  let fixture: ComponentFixture<JewelleryHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewelleryHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewelleryHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
