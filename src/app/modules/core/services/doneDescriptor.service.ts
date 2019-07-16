import { Injectable } from '@angular/core';
import { SymbolicEpistemicModel } from '../models/epistemicmodel/symbolic-epistemic-model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class DoneDescriptorService {

  constructor() { }

  getDoneDescriptorBoolean(sem: SymbolicEpistemicModel): Observable<Boolean> {
      return of(sem.getDoneDescriptorBoolean());
  }
}