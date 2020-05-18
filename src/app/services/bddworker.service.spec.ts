import { TestBed } from '@angular/core/testing';

import { BDDWorkerService } from './bddworker.service';

describe('BDDWorkerService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: BDDWorkerService = TestBed.get(BDDWorkerService);
        expect(service).toBeTruthy();
    });
});
