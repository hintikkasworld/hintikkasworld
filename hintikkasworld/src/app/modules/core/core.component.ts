import { MuddyChildren } from './models/examples/muddy-children';
import { Environment } from './models/environment/environment';
import { Component, OnInit, Input } from '@angular/core';
import { ExampleDescription } from './models/environment/exampledescription';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.css']
})
export class CoreComponent implements OnInit {

  @Input() exampleDescription: ExampleDescription;
  bsEnv: BehaviorSubject<Environment>;

  constructor() {}

  ngOnInit() {
    let env: Environment = new Environment(new MuddyChildren());
    this.bsEnv = new BehaviorSubject(env);
  }

  perform(action) {
    console.log(action)
    this.bsEnv.value.perform(action);
    this.bsEnv.next(this.bsEnv.value);
  }
}
