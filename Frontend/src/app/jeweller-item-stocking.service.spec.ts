import { TestBed } from '@angular/core/testing';

import { JewellerItemStockingService } from './jeweller-item-stocking.service';

describe('JewellerItemStockingService', () => {
  let service: JewellerItemStockingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JewellerItemStockingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
