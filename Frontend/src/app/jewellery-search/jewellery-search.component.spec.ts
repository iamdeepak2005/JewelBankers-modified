import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewellerySearchComponent } from './jewellery-search.component';

describe('JewellerySearchComponent', () => {
  let component: JewellerySearchComponent;
  let fixture: ComponentFixture<JewellerySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewellerySearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewellerySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
