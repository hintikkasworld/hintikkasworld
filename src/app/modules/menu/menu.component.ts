import { DiningCryptographersProblem } from './../core/models/examples/dining-cryptographers-problem';
import { Hats } from './../core/models/examples/hats';
import { NanoHanabi } from './../core/models/examples/nanohanabi';
import { Flatland } from './../core/models/examples/flatland';
import { SimpleSymbolicHanabi } from './../core/models/examples/symbolic-hanabi';
import { CellularAutomaton } from './../core/models/examples/cellular-automaton';
import { Simple } from './../core/models/examples/simple';
import { LinesBirthday } from './../core/models/examples/lines-birthday';
import { Cherylsbirthday } from './../core/models/examples/cherylsbirthday';
import { MineSweeper } from './../core/models/examples/mine-sweeper';
import { Belote } from './../core/models/examples/belote';
import { Router } from '@angular/router';
import { ConsecutiveNumbers } from './../core/models/examples/consecutive-numbers';
import { MuddyChildren } from './../core/models/examples/muddy-children';
import { ExampleDescription } from './../core/models/environment/exampledescription';
import { Component, OnInit, Input } from '@angular/core';
import { ExampleService } from 'src/app/services/example.service';
import { SallyAndAnn } from '../core/models/examples/sally-and-ann';
import { SymbolicSimpleExample } from '../core/models/examples/symbolic-small-example';



@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'] 
})
export class MenuComponent implements OnInit {

  explicitExamples = [new Simple(), new MuddyChildren(), new SallyAndAnn(), new Hats(), new DiningCryptographersProblem(),
  new ConsecutiveNumbers(), new NanoHanabi(),
  new Cherylsbirthday(), new LinesBirthday(), new CellularAutomaton()];

  symbolicExamples = [new SymbolicSimpleExample(), new MineSweeper(2, 2, 1),  new MineSweeper(5, 6, 15), new MineSweeper(8, 10, 3), new MineSweeper(10, 10, 6), new MineSweeper(12, 15, 20), new Belote(), new SimpleSymbolicHanabi(), new Flatland()];
  
  openExampleDescription(exampleDescription: ExampleDescription) {
    this.exampleService.setExampleDescription(exampleDescription);
    this.router.navigate(['core']);
  }

  constructor(private exampleService: ExampleService, private router: Router) { }

  ngOnInit() {
  }

}
