import { Injectable } from '@angular/core';
import { ExampleDescription } from '../modules/core/models/environment/exampledescription';
import { Simple } from '../modules/core/models/examples/simple';

@Injectable({
    providedIn: 'root',
})

/** this service is to give the correct exampledescription from menu to core. */
export class ExampleService {
    private exampleDescription: ExampleDescription = new Simple();

    // by default, the loaded example is .... :)

    setExampleDescription(exampleDescription: ExampleDescription) {
        this.exampleDescription = exampleDescription;
    }

    getExampleDescription() {
        return this.exampleDescription;
    }

    constructor() {}
}
