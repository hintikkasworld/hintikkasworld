import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreComponent } from './core.component';
import { ComicsComponent } from './components/comics/comics.component';
import { ActionListComponent } from './components/action-list/action-list.component';
import { EpistemicModelComponent } from './components/epistemic-model/epistemic-model.component';

@NgModule({
  declarations: [CoreComponent, ComicsComponent, ActionListComponent, EpistemicModelComponent],
  imports: [
    CommonModule
  ],

  exports: [CoreComponent]
})
export class CoreModule { }
