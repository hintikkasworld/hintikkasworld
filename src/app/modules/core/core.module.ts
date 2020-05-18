import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreComponent } from './core.component';
import { ComicsComponent } from './components/comics/comics.component';
import { ActionListComponent } from './components/action-list/action-list.component';
import { EdgeComponent } from './components/visualization/edge/edge.component';
import { NodeComponent } from './components/visualization/node/node.component';
import { GraphComponent } from './components/visualization/graph/graph.component';
import { DraggableDirective } from './services/directives/draggable.directive';

@NgModule({
    declarations: [CoreComponent, ComicsComponent, ActionListComponent, EdgeComponent, NodeComponent, GraphComponent, DraggableDirective],
    imports: [CommonModule],

    exports: [CoreComponent],
})
export class CoreModule {}
