import { Action } from '../../models/environment/action';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Environment } from '../../models/environment/environment';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-action-list',
    templateUrl: './action-list.component.html',
    styleUrls: ['./action-list.component.css']
})
export class ActionListComponent implements OnInit {
    @Input() obsEnv: Observable<Environment>;
    @Output() toPerform: EventEmitter<Action> = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    perform(action: Action) {
        this.toPerform.emit(action);
    }
}
