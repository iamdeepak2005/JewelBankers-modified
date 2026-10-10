import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsupplierComponent } from './newsupplier.component';

describe('NewsupplierComponent', () => {
  let component: NewsupplierComponent;
  let fixture: ComponentFixture<NewsupplierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsupplierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsupplierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
