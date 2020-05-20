import { ComicsComponent } from './comics.component';

describe('ComicsComponent', () => {
    it('Maps with string should work', () => {
        expect(
            (function () {
                let A = new Map();
                let o = 'aze';
                A.set(o, 2);
                return A.get(o) == 2;
            })()
        ).toBeTruthy();
    });

    it('Maps with objects should work', () => {
        expect(
            (function () {
                let A = new Map();
                let o = { x: 0, y: 1 };
                A.set(o, 2);
                return A.get(o) == 2;
            })()
        ).toBeTruthy();
    });
});
