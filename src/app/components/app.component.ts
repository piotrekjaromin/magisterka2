import {Component, OnInit} from '@angular/core';
import {LeafletEvent} from 'leaflet';
import {DataService} from '../services/data.service';
import * as L from 'leaflet';
import {LayerManager} from '../layerManager';
import {DbDataService} from '../services/dbData.service';
import {collectExternalReferences} from '@angular/compiler';
import {DbLayerManager} from '../dbLayerManager';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  options = null;
  layersControl = null;
  layers = null;
  lat = 0;
  long = 0;
  mymap: L.Map;
  popup = L.popup();
  isShowed = false;
  drawOptions: any;

  constructor(private dataService: DataService, private dbDataService: DbDataService) {
  }


  ngOnInit(): void {
    this.getDataFromDB();
    //this.getDataFromFile();
  }

  getDataFromDB() {
    this.dbDataService.loadRoadsFromDB().subscribe(data => {
      const layerManager = new DbLayerManager(this.dataService, <any>data);
      this.prepareDataToGenerateMap(layerManager);
    });
  }

  getDataFromFile() {
    this.dataService.getJson().subscribe(data => {
      const layerManager = new LayerManager(this.dataService, this.dbDataService, <any>data);
      this.prepareDataToGenerateMap(layerManager);
    });
  }

  prepareDataToGenerateMap(layerManager: any) {
    this.drawOptions = layerManager.drawOnMapOptions;
    this.options = layerManager.options;
    this.layersControl = layerManager.layersControl;
  }

  onMapReady(readyMap: L.Map) {
    console.log('Map is ready');
    this.mymap = readyMap;
    this.mymap.on('click', (data: LeafletEvent) => {
      const latlng = data.latlng;
      this.lat = latlng.lat;
      this.long = latlng.lng;
      console.log(this.lat);
      console.log(this.long);
      this.popup
        .setLatLng(latlng)
        .setContent(latlng.toString())
        .openOn(this.mymap);
    });
  }

  addMarker() {
    L.marker({lat: this.lat, lng: this.long}).addTo(this.mymap);
    console.log('added marker');
    this.ngOnInit();
  }
}
