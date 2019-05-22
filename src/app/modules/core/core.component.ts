import { EventModelAction } from './models/environment/event-model-action';
import { Action } from './models/environment/action';
import { MuddyChildren } from './models/examples/muddy-children';
import { environment } from './../../../environments/environment';

import { Location } from '@angular/common';
import { ExampleService } from './../../services/example.service';
import { Environment } from './models/environment/environment';
import { Component, OnInit, Input } from '@angular/core';
import { ExampleDescription } from './models/environment/exampledescription';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { FormulaFactory, Formula } from './models/formula/formula';
import { ExplicitEventModel } from './models/eventmodel/explicit-event-model';
import { SymbolicPublicAnnouncement } from './models/eventmodel/symbolic-public-announcement';
import { SymbolicEpistemicModel } from './models/epistemicmodel/symbolic-epistemic-model';



@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.css']
})
export class CoreComponent implements OnInit {

  bsEnv: BehaviorSubject<Environment>;

  constructor(private exampleService: ExampleService, private location: Location) { }

  ngOnInit() {
    let exampleDescription = this.exampleService.getExampleDescription();
    let env: Environment;
	  try {
      env = new Environment(exampleDescription);
    }
    catch (error) {
      let err = <Error>error;
      console.error(err.name, err.message);
      console.error(err.stack);
      console.log("Error: so we load MuddyChildren!");
      exampleDescription = new MuddyChildren();
      env = new Environment(exampleDescription);
    }
    this.bsEnv = new BehaviorSubject(env);

    this.bsEnv.subscribe(env => this.initModelChecking());
  }


  getFormulaGUI(): Formula {
    return FormulaFactory.createFormula(<string>$("#formula").val());
  }

  modelChecking(): boolean {
    try {
      const result = this.bsEnv.value.getEpistemicModel().check(this.getFormulaGUI());
      console.log(result);
      $('#modelCheckingButtonImage').attr("src", result ? "assets/img/ok.png" : "assets/img/notok.png");
      return result;
    }
    catch (error) {
      $("#error").html(error);
    }
  }

  initModelChecking() {
    $('#modelCheckingButtonImage').attr("src", "assets/img/mc.png");
    $("#error").html("");
  }


  performPublicAnnouncement() {
    if (!this.modelChecking()) return;



    this.bsEnv.value.perform(new EventModelAction({
      name: "public announcement",
      eventModel:
        this.bsEnv.value.getEpistemicModel() instanceof SymbolicEpistemicModel ?
          new SymbolicPublicAnnouncement(this.getFormulaGUI())
          : ExplicitEventModel.getEventModelPublicAnnouncement(this.getFormulaGUI())
    }));
    this.bsEnv.next(this.bsEnv.value);
  }


  perform(action: Action) {
    console.log(action)
    this.bsEnv.value.perform(action);
    this.bsEnv.next(this.bsEnv.value);
  }


  reset() {
    this.bsEnv.value.reset();
    this.bsEnv.next(this.bsEnv.value);
  }

  chooseAnotherExample(): void {
    this.location.back();	
  }
  setInternalPerspective(a: string) {
    this.bsEnv.value.agentPerspective = a;
    this.bsEnv.next(this.bsEnv.value);
  }

  setExternalPerspective() {
    this.bsEnv.value.agentPerspective = undefined;
    this.bsEnv.next(this.bsEnv.value);
  }

  getAgents(): string[] {
    return this.bsEnv.value.getEpistemicModel().getAgents();
  }


  getAtomicPropositions(): string[] {
    return this.bsEnv.value.getExampleDescription().getAtomicPropositions();
  }

  showHelp() {
    window.open("assets/about.html", "_target");
  }
}
