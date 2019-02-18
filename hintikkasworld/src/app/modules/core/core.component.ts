import { MuddyChildren } from './models/examples/muddy-children';
import { Environment } from './models/environment';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.css']
})
export class CoreComponent implements OnInit {

  @Input() env: Environment = new Environment(new MuddyChildren());

  constructor() { }

  ngOnInit() {
  }

}
