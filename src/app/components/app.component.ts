import {Component, OnInit} from '@angular/core';
import {LeafletEvent} from 'leaflet';
import {DataService} from '../services/data.service';
import * as L from 'leaflet';
import {FileLayerManager} from '../layerManagers/fileLayerManager';
import {DbDataService} from '../services/dbData.service';
import {DbLayerManager} from '../layerManagers/dbLayerManager';
import {CustomMarker} from '../models/customMarker';

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
  type: string;
  mymap: L.Map;
  popup = L.popup();
  isShowed = false;
  drawOptions: any;

  constructor(private dataService: DataService, private dbDataService: DbDataService) {
  }


  ngOnInit(): void {
    this.getDataFromDB();
    // this.getDataFromFile();
    // this.exportRoadsAndObjectsToDB();
  }

  getDataFromDB() {
    this.dbDataService.loadDataFromDB(this.dbDataService.roadHttp).subscribe(roadsData => {
      this.dbDataService.loadDataFromDB(this.dbDataService.objectHttp).subscribe(objectData => {
        this.dbDataService.loadDataFromDB(this.dbDataService.customMarkerHttp).subscribe(customMarkerData => {
          const layerManager = new DbLayerManager(this.dataService, <any>roadsData, <any> objectData, customMarkerData);
          this.prepareDataToGenerateMap(layerManager);
        });
      });
    });
  }

  exportRoadsAndObjectsToDB() {
    this.dataService.getJson().subscribe(data => {
      const layerManager = new FileLayerManager(this.dataService, this.dbDataService, <any>data);
      const onlyRoadsFeatures = layerManager.prepareRoadsWithSpeedLimits();
      const onlyObjectsFeatures = this.dataService.getObjects(<any>data).features;
      this.dbDataService.saveAllDataToDB(onlyRoadsFeatures, onlyObjectsFeatures);
    });
  }

  getDataFromFile() {
    this.dataService.getJson().subscribe(data => {
      const layerManager = new FileLayerManager(this.dataService, this.dbDataService, <any>data);
      this.prepareDataToGenerateMap(layerManager);
    });
  }

  prepareDataToGenerateMap(layerManager: any) {
    this.drawOptions = layerManager.drawOnMapOptions;
    this.options = layerManager.options;
    this.layersControl = layerManager.layersControl;
  }

  onMapReady(readyMap: L.Map) {
    this.mymap = readyMap;
    this.mymap.on('click', (data: LeafletEvent) => {
      const latlng = data.latlng;
      this.lat = latlng.lat;
      this.long = latlng.lng;
      this.popup
        .setLatLng(latlng)
        .setContent(latlng.toString())
        .openOn(this.mymap);
    });
  }

  showFields() {
    this.isShowed = true;
  }

  addMarker() {
    L.marker({lat: this.lat, lng: this.long}).addTo(this.mymap);
    const customMarker = new CustomMarker(this.lat, this.long, this.type, 0);
    this.dbDataService.saveCustomMarkerToDB(customMarker);
  }
}
