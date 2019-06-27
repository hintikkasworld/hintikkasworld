import { ExampleDescription } from './../../../core/models/environment/exampledescription';
import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';


@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {

  @Input() exampleDescription: ExampleDescription;
<<<<<<< HEAD
  @ViewChild('canvas', { static: true }) canvas:ElementRef;
=======
  @ViewChild('canvas', {read: ElementRef, static: true}) canvas:ElementRef;
>>>>>>> d3a25c608aa23d57a4e0da62a52ae7aa70377d48

  constructor() { 
  }

  ngOnInit() {
    
  }

  ngAfterViewInit() {
    let canvas = (<HTMLCanvasElement> this.canvas.nativeElement);
    canvas.width= 128;
    canvas.height = 64;
    let ctx = canvas.getContext('2d');
    let world =  this.exampleDescription.getWorldExample();
    setTimeout(() => world.draw(ctx), 500);
    
  }

}
