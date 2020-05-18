import { BddService } from './bdd.service';

describe('BddService', () => {
    it('true should work', (done) => {
        expect(
            (function test() {
                let service: BddService = new BddService(() => {
                    console.log('BEGINNING OF BDD SERVICE TESTS');

                    let bTrue = service.createTrue();

                    console.log('is true true ?');
                    console.log(service.isTrue(bTrue));

                    let bFalse = service.createFalse();

                    console.log('is false false ?');
                    console.log(service.isFalse(bFalse));

                    let bAtom = service.createLiteral('p');
                    console.log('is the atom an atom ?');
                    console.log(service.getAtomOf(bAtom));

                    let bP = service.applyIte(bAtom, bTrue, bFalse);
                    console.log('the node for p is: ' + bP);

                    console.log('END OF BDD SERVICE TESTS');
                    done();
                });
            })()
        ).toBeUndefined();
    });
});
