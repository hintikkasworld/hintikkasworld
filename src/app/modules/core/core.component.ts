import { MuddyChildren } from './models/examples/muddy-children';
import { environment } from './../../../environments/environment';

import { ExampleService } from './../../services/example.service';
import { Environment } from './models/environment/environment';
import { Component, OnInit, Input } from '@angular/core';
import { ExampleDescription } from './models/environment/exampledescription';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';



@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.css']
})
export class CoreComponent implements OnInit {

  bsEnv: BehaviorSubject<Environment>;

  constructor(private exampleService: ExampleService) { }

  ngOnInit() {
    let exampleDescription = this.exampleService.getExampleDescription();
    let env: Environment; 
    try {
       env = new Environment(exampleDescription);
    }
    catch(error) {
      let err = <Error> error;
      console.error(err.name, err.message);
      console.error(err.stack);
      console.log("Error: so we load MuddyChildren!");
      exampleDescription = new MuddyChildren();
      env = new Environment(exampleDescription);
    }    
    this.bsEnv = new BehaviorSubject(env);
  }

  perform(action) {
    console.log(action)
    this.bsEnv.value.perform(action);
    this.bsEnv.next(this.bsEnv.value);
  }

  setInternalPerspective(a: string) {
    this.bsEnv.value.agentPerspective = a;
    this.bsEnv.next(this.bsEnv.value);
  }

  setExternalPerspective() {
    this.bsEnv.value.agentPerspective = undefined;
    this.bsEnv.next(this.bsEnv.value);
  }

  getAgents(): string[] {
    return this.bsEnv.value.getEpistemicModel().getAgents();
  }
}
