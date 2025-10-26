# Hintikka's World

Welcome to Hintikka's World! This website shows intelligent artificial agents reasoning about higher-order knowledge (a knows that b knows that...).
It enables to explore mental states of the agents by clicking on them.

<img width="489" height="684" alt="hintikkasworld_muddychildren" src="https://github.com/user-attachments/assets/0ab78e3f-3573-4ac7-b46f-b28da3834c57" />


It contains many classical AI examples.
It is a tribute to Jaakko Hintikka. This tool can be used for:
- learning modal logic, model checking and satisfiability problem;
- learning models of dynamic epistemic logic;
- having fun with epistemic puzzles.

## Installation

To setup the project, run:
- `sudo dnf install npm`;
- `sudo npm update -g`;
- `npm install`.
- `npm install -g @angular/cli@8.0.4`.

The project also uses a wrapper of CUDD, a library for manipulating Binary Decision Diagrams. 
It is in the folder cuddjs. The code is in C and is compiled in wasm (but the file is a .asm2 file for the Angular project being able to load it).

## Usage

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


### Adding an example
In 'app/modules/core/models/examples',  
run `ng generate class BattleShips`

The class should extend `ExampleDescription`.

Then in `MenuComponent`, add the example.

