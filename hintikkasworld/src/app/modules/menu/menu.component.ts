import { MineSweeper } from './../core/models/examples/mine-sweeper';
import { Belote } from './../core/models/examples/belote';
import {Router} from '@angular/router';
import { ConsecutiveNumbers } from './../core/models/examples/consecutive-numbers';
import { MuddyChildren } from './../core/models/examples/muddy-children';
import { ExampleDescription } from './../core/models/environment/exampledescription';
import { Component, OnInit, Input } from '@angular/core';
import { ExampleService } from 'src/app/services/example.service';



@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  examples = [new MuddyChildren(), new MineSweeper(), new ConsecutiveNumbers(), new Belote()];

  openExampleDescription(exampleDescription: ExampleDescription ) {
    this.exampleService.setExampleDescription(exampleDescription);
    this.router.navigate(['core']);
  }
  constructor(private exampleService: ExampleService, private router: Router) { }

  ngOnInit() {
  }

}
