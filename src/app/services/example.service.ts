import { MuddyChildren } from './../modules/core/models/examples/muddy-children';
import { Injectable } from '@angular/core';
import { ExampleDescription } from '../modules/core/models/environment/exampledescription';

@Injectable({
  providedIn: 'root'
})

/** this service is to give the correct exampledescription from menu to core. */
export class ExampleService {

  private exampleDescription: ExampleDescription = new MuddyChildren();
  //by default, the loaded example is MuddyChildren

  setExampleDescription(exampleDescription: ExampleDescription) {
    this.exampleDescription = exampleDescription;
  }

  getExampleDescription() {
    return this.exampleDescription;
  }

  constructor() { }
}
