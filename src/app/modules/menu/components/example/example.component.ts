import { ExampleDescription } from './../../../core/models/environment/exampledescription';
import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';


@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {

  @Input() exampleDescription: ExampleDescription;
  @ViewChild('canvas') canvas:ElementRef;

  constructor() { 
  }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    let canvas = (<HTMLCanvasElement> this.canvas.nativeElement);
    canvas.width= 128;
    canvas.height = 64;
    let ctx = canvas.getContext('2d');
    this.exampleDescription.getWorldExample().draw(ctx);
  }

}
