import {Injectable} from '@angular/core';


import { HttpHeaders, HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Geojsonmodel} from '../models/geojsonmodel';
import {Feature} from '../models/feature';
import {icon, latLng, LayerGroup, marker, Marker, tileLayer, TileLayer} from 'leaflet';
import {SpeedService} from './speed.service';
import {CustomMarker} from '../models/customMarker';

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



  // saveRoadToDB(feature: Feature, markers: [CustomMarker]) {
  //   const geometryModel = new GeometryModel(feature.geometry.type, feature.geometry.coordinates);
  //   const propertiesModel = new PropertiesModel(feature.properties.highway, feature.properties.surface);
  //   const road =  new Road(feature.id, feature.type, propertiesModel, geometryModel, markers);
  //   const headers = new HttpHeaders().set('Content-Type', 'application/json');
  //   this.http.post(this.roadHttp, road, {headers}).subscribe();
  // }
  //
  // loadRoadsFromDB() {
  //   return this.http.get(this.roadHttp);
  // }

}
