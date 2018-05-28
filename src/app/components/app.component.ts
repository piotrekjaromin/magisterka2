import {Component, OnInit} from '@angular/core';
import {LeafletEvent} from 'leaflet';
import {DataService} from '../services/data.service';
import * as L from 'leaflet';
import {FileLayerManager} from '../layerManagers/fileLayerManager';
import {DbDataService} from '../services/dbData.service';
import {DbLayerManager} from '../layerManagers/dbLayerManager';
import {CustomMarker} from '../models/customMarker';
import {FeatureFromDB} from '../models/featureFromDB';
import {Feature} from '../models/feature';
import {Geometry} from '../models/geometry';
import {Properties} from '../models/properties';
import {PropertiesFromDB} from '../models/propertiesFromDB';

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
  coordinates = <[[[number, number]]]>[];
  type: string;
  mymap: L.Map;
  popup = L.popup();
  isShowedField = true;
  isShowedAddButton = true;
  drawOptions: any;

  constructor(private dataService: DataService, private dbDataService: DbDataService) {
  }


  ngOnInit(): void {
    // this.getDataFromDB();
    // this.getDataFromFile();
    // this.exportRoadsAndObjectsToDB();
    // this.saveStreetToDB();
    // this.saveObjectsToDB();
    this.getDataFromDB();
  }

  saveObjectsToDB() {
    this.dataService.getJson().subscribe(data => {
      const trafficSignals = this.dataService.getTrafficSignal(<any>data);
      const railCrossing = this.dataService.getRailCrossing(<any>data);
      const pedestrialCrossing = this.dataService.getPedestrialCrossing(<any>data);
      const busStops = this.dataService.getBusStops(<any>data);
      const schools = this.dataService.getSchools(<any>data);
      const shopAndChurches = this.dataService.getShopsAndChurches(<any>data);
      this.dbDataService.saveObjectsToDB(trafficSignals.features);
      this.dbDataService.saveObjectsToDB(railCrossing.features);
      this.dbDataService.saveObjectsToDB(pedestrialCrossing.features);
      this.dbDataService.saveObjectsToDB(busStops.features);
      this.dbDataService.saveObjectsToDB(schools.features);
      this.dbDataService.saveObjectsToDB(shopAndChurches.features);
    });
  }

  saveStreetToDB() {
    this.dataService.getJson().subscribe(data => {
      const streets = this.dataService.getOnlyStreet(<any>data);
      this.dbDataService.saveRoadsToDB(streets.features);
    });
  }

  getDataFromDB() {
    this.dbDataService.loadDataFromDB(this.dbDataService.roadHttp).subscribe(roadsData => {
      this.dbDataService.loadDataFromDB(this.dbDataService.objectHttp).subscribe(objectData => {
        const roads: [FeatureFromDB] = <any>roadsData;
        const objects: [FeatureFromDB] = <any>objectData;
        const layerManager = new DbLayerManager(<any>roads, <any>objects);
        this.prepareDataToGenerateMap(layerManager);
      });
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
      this.isShowedAddButton = true;
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
    this.isShowedField = true;
  }

  addCoordinates() {
    console.log(this.lat, this.long);
    this.coordinates.push([[this.long, this.lat]]);
  }

  addThreat() {

    const properties = new PropertiesFromDB('addedByUser', '', '', '', this.type);
    let geometry: Geometry;
    console.log(this.coordinates.length);
    if (this.coordinates.length === 1) {
      geometry = new Geometry('Point', <any>this.coordinates);
    } else if (this.coordinates.length > 1) {
      this.coordinates.push(this.coordinates[0]);
      geometry = new Geometry('Polygon', <any>this.coordinates);
    }

    const feature: Feature = new Feature(new Date().getTime().toString(), 'Feature', <any>properties, geometry, <[CustomMarker]>[]);
    this.dbDataService.saveObjectToDB(feature);
  }
}
