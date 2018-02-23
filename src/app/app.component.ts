import {Component, OnInit} from '@angular/core';
import {geoJSON, icon, latLng, layerGroup, LayerGroup, LeafletEvent, map, Marker, marker, TileLayer} from 'leaflet';
import {DataService} from './data.service';
import {Geojsonmodel} from './geojsonmodel';
import * as L from 'leaflet';
import {AllMapData} from './models/allMapData';
import {Road} from './models/road';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  onlyStreetGeoModel: Geojsonmodel  = null;
  options = null;
  mainLayer: TileLayer;
  fullGeoLayer = null;
  onlyStreetGeoLayer = null;
  layersControl = null;
  layers = null;
  layerGroup: LayerGroup = null;
  lat = 0;
  long = 0;
  mymap: L.Map;
  popup = L.popup();
  isShowed = false;

  drawOptions = {
    position: 'topright',
    draw: {
      marker: {
        icon: L.icon({
          iconSize: [ 25, 41 ],
          iconAnchor: [ 13, 41 ],
          iconUrl: 'assets/marker-icon.png',
          shadowUrl: 'assets/marker-shadow.png'
        })
      },
      polyline: false,
      circle: {
        shapeOptions: {
          color: '#aaaaaa'
        }
      }
    }
  };

  constructor(private dataService: DataService) {}


  ngOnInit(): void {

    this.dataService.loadRoadsFromDB().subscribe(data => { console.log(data);
      var allMapData = new AllMapData('FeatureCollection', <any> data);
      console.log(allMapData)
      // this.dataService.getJson().subscribe(data => {
      this.fullGeoLayer = geoJSON(<any> allMapData);
      // this.fullGeoLayer = geoJSON(data.json());
      this.onlyStreetGeoModel = this.dataService.getOnlyStreet(<any> allMapData);
      // this.onlyStreetGeoModel = this.dataService.getOnlyStreet(data.json());
      this.onlyStreetGeoLayer = geoJSON(JSON.parse(JSON.stringify(this.onlyStreetGeoModel)));

      this.mainLayer = this.dataService.prepareMainLayer();

      this.options = this.dataService.prepareOptions(this.mainLayer);
      this.layerGroup = this.dataService.prepareMarkersLayer(this.onlyStreetGeoModel.features);
      this.layersControl = {
        baseLayers: {
          'Open Street Map': this.mainLayer
        },
        overlays: {
          'All objects': this.fullGeoLayer,
          'Only street': this.onlyStreetGeoLayer,
          'Markers': this.layerGroup
        }
      };
    });
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

  showFields() {
    if (this.lat !== 0 && this.long !== 0) {
      this.isShowed = true;
    }
  }

  addMarker() {
    L.marker({lat: this.lat, lng: this.long}).addTo(this.mymap);
    console.log('added marker');
    this.ngOnInit();
  }
}
