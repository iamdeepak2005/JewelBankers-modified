import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoughprintComponent } from './roughprint.component';

describe('RoughprintComponent', () => {
  let component: RoughprintComponent;
  let fixture: ComponentFixture<RoughprintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoughprintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoughprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
