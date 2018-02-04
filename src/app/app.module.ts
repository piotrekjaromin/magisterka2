import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import { AppComponent } from './app.component';
import {SpeedService} from './speed.service';
import {DataService} from './data.service';
import {HttpModule} from '@angular/http';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    LeafletModule.forRoot(),
    LeafletDrawModule.forRoot(),
    FormsModule
  ],
  providers: [DataService, SpeedService],
  bootstrap: [AppComponent]
})
export class AppModule { }
