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

	  let bAtom = service.createLiteral("p");
          console.log("is the atom an atom ?");
          console.log(service.getAtomOf(bAtom));

          let bP = service.applyIte(bAtom, bTrue, bFalse);
          console.log("the node for p is: " + bP);

          console.log("END OF BDD SERVICE TESTS");
        });
      }()      
    ).toBeTruthy();
});

it('literal should work', () => {
  let service: BddService = TestBed.get(BddService);
  expect(
    function test() {
      let b = service.createLiteral("p");
      return service.getAtomOf(b) == "p";
    }()
  ).toBeTruthy();
});
});
