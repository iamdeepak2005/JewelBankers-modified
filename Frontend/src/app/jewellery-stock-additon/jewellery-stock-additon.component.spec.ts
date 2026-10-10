import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JewelleryStockAdditonComponent } from './jewellery-stock-additon.component';

describe('JewelleryStockAdditonComponent', () => {
  let component: JewelleryStockAdditonComponent;
  let fixture: ComponentFixture<JewelleryStockAdditonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JewelleryStockAdditonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JewelleryStockAdditonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
