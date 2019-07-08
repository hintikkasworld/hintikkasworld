import { TestBed } from '@angular/core/testing';

import { BDDServiceWorkerService } from './bddservice-worker.service';

describe('BDDServiceWorkerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BDDServiceWorkerService = TestBed.get(BDDServiceWorkerService);
    expect(service).toBeTruthy();
  });
});
