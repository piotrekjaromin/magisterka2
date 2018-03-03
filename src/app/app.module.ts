import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import { AppComponent } from './components/app.component';
import {SpeedService} from './services/speed.service';
import {DataService} from './services/data.service';
import { FormsModule } from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {DbDataService} from './services/dbData.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    LeafletModule.forRoot(),
    LeafletDrawModule.forRoot(),
    FormsModule
  ],
  providers: [DataService, SpeedService, DbDataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
