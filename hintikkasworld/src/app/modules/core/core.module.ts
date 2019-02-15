import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreComponent } from './core.component';
import { ComicsComponent } from './components/comics/comics.component';

@NgModule({
  declarations: [CoreComponent, ComicsComponent],
  imports: [
    CommonModule
  ],

  exports: [CoreComponent]
})
export class CoreModule { }
