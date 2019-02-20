import { TestBed } from '@angular/core/testing';

import { BddService } from './bdd.service';

describe('BddService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BddService = TestBed.get(BddService);
    expect(service).toBeTruthy();
  });
});
