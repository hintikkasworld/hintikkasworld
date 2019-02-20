import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu.component';
import { ExampleComponent } from './components/example/example.component';

@NgModule({
  declarations: [MenuComponent, ExampleComponent],
  imports: [
    CommonModule
  ],

  exports: [MenuComponent]
})
export class MenuModule { }
