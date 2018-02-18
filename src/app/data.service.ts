import {Injectable} from '@angular/core';


import { HttpHeaders, HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Geojsonmodel} from './geojsonmodel';
import {Feature} from './feature';
import {icon, latLng, LayerGroup, marker, Marker, tileLayer, TileLayer} from 'leaflet';
import {SpeedService} from './speed.service';
import {CustomMarker} from './models/customMarker';
import {Road} from './models/road';
import {GeometryModel} from './models/geometryModel';
import {PropertiesModel} from './models/propertiesModel';

@Injectable()
export class DataService {

  roadHttp = 'http://localhost:5000/roads';

  constructor(private http: HttpClient) {
  }

  getJson() {
    return this.http.get('../assets/map_medium.geojson');
  }

  getOnlyStreet(geoModel: Geojsonmodel): Geojsonmodel {
    const features: [Feature] = geoModel.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    const filteredFeatures2: [Feature] = <[Feature]>[];
    for (const feature of features) {
      if (
        feature.geometry.type === 'LineString'
        && feature.properties.route !== 'bicycle'
        && feature.properties.route !== 'hiking'
        && feature.properties.route !== 'bus'
        && feature.properties.highway !== 'path'
        && feature.properties.highway !== 'cycleway'
        && feature.properties.highway !== 'footway'
        && feature.properties.highway !== 'track'
        && feature.properties.highway !== 'steps'
        && feature.properties.highway !== 'proposed'

        && feature.properties.natural === undefined
        && feature.properties.barrier === undefined
        && feature.properties.waterway === undefined
        // && feature.properties.highway !== 'residential' // to remove
        // && feature.properties.surface !== 'asphalt' // to remove
        // && feature.properties.highway !== 'tertiary' // to remove
        // && feature.properties.highway !== 'living_street' // to remove
        // && feature.properties.bicycle === undefined // to remove
        // && feature.properties.highway === undefined // to remove
        // && feature.properties.highway !== 'service' // to remove
        // && feature.properties.highway !== 'primary' // to remove
        // && feature.properties.highway !== 'secondary' // to remove
        // && feature.properties.highway !== 'construction' // to remove
        && feature.properties.location !== 'overhead'
        && feature.properties.location !== 'underground'
        && feature.properties.traffic_calming !== 'island'
        && feature.properties.railway === undefined
        && feature.properties.man_made === undefined
        && feature.properties.network === undefined
        && feature.properties.highway !== 'pedestrian'
        && feature.properties.boundary === undefined
        && feature.properties.construction !== 'footway'
        && feature.properties.landcover !== 'grass'
        && feature.properties.service !== 'parking_aisle'
        && feature.properties.type !== 'parking_fee'
        && feature.properties.power === undefined
        && feature.properties.playground === undefined
        && feature.properties.description === undefined
      ) {
        // console.log(feature.properties);
        filteredFeatures.push(feature);
      }
    }
    geoModel.features = filteredFeatures;
    return geoModel;
  }

  prepareMarkersLayer(features: [Feature]): LayerGroup {

    const markers: [Marker] = <[Marker]>[];

    for (const feature of features) {
      const roadMarkers: [CustomMarker] = <[CustomMarker]>[];

      const arrayOfLengths = this.getStreetLength(feature.geometry.coordinates);
      const totalLengthOfStreet = arrayOfLengths[arrayOfLengths.length - 3];

      let currentLength = 0;
      const maxSpeed = SpeedService.getMaxSpeed(feature, totalLengthOfStreet * 111196.672);
      for (let i = 0; i < arrayOfLengths.length; i += 3) {
        currentLength += arrayOfLengths[i];


        if (currentLength >= (totalLengthOfStreet / 2)) {
          roadMarkers.push(new CustomMarker(arrayOfLengths[i + 1], arrayOfLengths[i + 2], '', maxSpeed));

          const tmpMarker = marker([arrayOfLengths[i + 1], arrayOfLengths[i + 2]], {
            icon: icon({
              iconSize: [25, 25],
              iconAnchor: [0, 0],
              iconUrl: 'assets/' + maxSpeed + '.png'
            })});

          markers.push(tmpMarker.on('click', (data) => console.log(data)));
          feature.markers = roadMarkers;
          break;
        }
      }
    //  this.saveRoadToDB(feature, roadMarkers);
    //   this.loadRoadsFromDB();
    }
    return new LayerGroup(markers);
  }

  private getStreetLength(coordinates: [[number, number]]): [number, number, number] {
    const arrayOfLength: [number, number, number] = <[number, number, number]>[];
    let totalLength = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      let x0 = coordinates[i][0];
      let x1 = coordinates[i + 1][0];

      if (x0 > x1) {
        const tmp = x0;
        x0 = x1;
        x1 = tmp;
      }

      let y0 = coordinates[i][1];
      let y1 = coordinates[i + 1][1];

      if (y0 > y1) {
        const tmp = y0;
        y0 = y1;
        y1 = tmp;
      }

      const xLenght = x1 - x0;
      const yLength = y1 - y0;

      const length = Math.sqrt(Math.pow(xLenght, 2) + Math.pow(yLength, 2)); // length between two nearest coordinates
      const latCoordinate = y1 - (yLength / 2); // center latitude coordinate between two nearest coordinates
      const longCoordinate = x1 - (xLenght / 2); // center longitude coordinate between two nearest coordinates
      arrayOfLength.push(length, latCoordinate, longCoordinate);
      totalLength += length;
    }
    arrayOfLength.push(totalLength, 0, 0);
    return arrayOfLength;
  }


  prepareMainLayer() {
    return tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      detectRetina: true
    });
  }

  prepareOptions(layer: TileLayer) {
    return {
      layers: [
        layer]
      ,
      zoom: 15,
      center: latLng([50.034279, 19.894034]),
      legend: {
        position: 'bottomleft',
        colors: ['#ff0000', '#28c9ff', '#0000ff', '#ecf386'],
        labels: ['National Cycle Route', 'Regional Cycle Route', 'Local Cycle Network', 'Cycleway']
      },
    };
  }

  saveRoadToDB(feature: Feature, markers: [CustomMarker]) {
    const geometryModel = new GeometryModel(feature.geometry.type, feature.geometry.coordinates);
    const propertiesModel = new PropertiesModel(feature.properties.highway, feature.properties.surface);
    const road =  new Road(feature.id, feature.type, propertiesModel, geometryModel, markers);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(this.roadHttp, road, {headers}).subscribe();
  }

  loadRoadsFromDB() {
    this.http.get(this.roadHttp).subscribe(data => console.log(data));
  }

}
