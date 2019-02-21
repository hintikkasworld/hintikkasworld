import { TestBed } from '@angular/core/testing';

import { BddService } from './bdd.service';

describe('BddService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BddService = TestBed.get(BddService);
    expect(service).toBeTruthy();
  });

  it('true should work', () => {

    expect(
      function test() {
        let service: BddService = new BddService(() => {
          console.log("BEGINNING OF BDD SERVICE TESTS");
          
          
          let bTrue = service.createTrue();

          console.log("is true true ?");
          console.log(service.isTrue(bTrue));

          let bFalse = service.createFalse();

          console.log("is false false ?");
          console.log(service.isFalse(bFalse));

          let bP = service.createIte("p", bTrue, bFalse);
          console.log("the node for p is: " + bP);

          console.log("END OF BDD SERVICE TESTS");
        });
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
