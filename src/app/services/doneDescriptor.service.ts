import { Injectable } from '@angular/core';
import { SymbolicEpistemicModel } from '../modules/core/models/epistemicmodel/symbolic-epistemic-model';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class DoneDescriptorService {

  constructor() { }

  getDoneDescriptor(sem: SymbolicEpistemicModel): Observable<boolean> {
    return of(sem.doneDescriptor);
  }
}