import { TestBed } from '@angular/core/testing';

import { BddService } from './bdd.service';

describe('BddService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BddService = TestBed.get(BddService);
    expect(service).toBeTruthy();
  });

  it('true should work', () => {
    let service: BddService = TestBed.get(BddService);
    expect(
      function test() {
        let b = service.createTrue();
        return service.isTrue(b);
      }()
    ).toBeTruthy();
  });

  it('ite should work', () => {
    let service: BddService = TestBed.get(BddService);
    expect(
      function test() {
        let b = service.createIte("p", service.createTrue(), service.createFalse());
        return service.getVarOf(b) == "p";
      }()
    ).toBeTruthy();
  });
});
