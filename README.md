# Hintikkasworld

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.1.


## Settings


Before install Angular:
- `sudo npm update -g`;
- `npm install -g @angular/cli`.

Please install:
- npm install d3 -save

The project also uses a wrapper of CUDD, a library for manipulating Binary Decision Diagrams. It is in the folder cuddjs. The code is in C and is compiled in wasm (but the file is a .asm2 file for the Angular project being able to load it).


If you have the error
ERROR in ./cuddjs/release/cuddjs.js
Module not found: Error: Can't resolve 'fs' in '/home/fschwarz/HW/hintikkasworld/cuddjs/release'
ERROR in ./cuddjs/release/cuddjs.js
Module not found: Error: Can't resolve 'path' in '/home/fschwarz/HW/hintikkasworld/cuddjs/release'
please run:
- npm install fs
- npm install crypto
- npm install path


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
