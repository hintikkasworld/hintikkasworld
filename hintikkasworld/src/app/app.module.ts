import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HomeComponent } from './modules/home/home.component';
import { HomeModule } from './modules/home/home.module';

import {RouterModule, Routes} from '@angular/router';
import { MenuComponent } from './modules/menu/menu.component';
import { CoreComponent } from './modules/core/core.component';
import { MenuModule } from './modules/menu/menu.module';
import { CoreModule } from './modules/core/core.module';


const appRoutes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'menu', component: MenuComponent},
  {path: 'core', component: CoreComponent},
];


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HomeModule,
    MenuModule,
    CoreModule,
    RouterModule.forRoot(appRoutes, 
                         {enableTracing: true} // <--- debugging purposes only
      )
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule { }
