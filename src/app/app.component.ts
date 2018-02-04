import {Component, OnInit} from '@angular/core';
import {geoJSON, icon, latLng, layerGroup, LayerGroup, map, Marker, marker, TileLayer} from 'leaflet';
import {DataService} from './data.service';
import {Geojsonmodel} from './geojsonmodel';
import * as L from 'leaflet';

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


    console.log('refresh')
    this.dataService.getJson().subscribe(data => {
      this.fullGeoLayer = geoJSON(data.json());
      this.onlyStreetGeoModel = this.dataService.getOnlyStreet(data.json());
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

  onMapReady(map1: L.Map) {
    console.log('Map is ready');
    this.mymap = map1;


    this.mymap.on('click', (data) => {
      const latlng = data.latlng;
      this.lat = latlng.lat;
      this.long = latlng.lng;
      console.log(this.lat)
      console.log(this.long)
      this.popup
        .setLatLng(latlng)
        .setContent(latlng.toString())
        .openOn(this.mymap);

    });


  }
}
