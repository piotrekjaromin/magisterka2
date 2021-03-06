import {Injectable} from '@angular/core';
import { HttpHeaders, HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Feature} from '../models/feature';
import {PropertiesFromDB} from '../models/propertiesFromDB';
import {Geometry} from '../models/geometry';
import {FeatureFromDB} from '../models/featureFromDB';
import {SimpleObject} from '../models/simpleObject';
import {CustomMarker} from '../models/customMarker';
import {SpeedService} from './speed.service';

@Injectable()
export class DbDataService {
  public roadHttp = 'http://localhost:5000/roads';
  public objectHttp = 'http://localhost:5000/objects';
  public customMarkerHttp = 'http://localhost:5000/markers';

  constructor(private http: HttpClient) {}

  saveRoadsToDB(features: [Feature]) {
    for (const feature of features) {
      this.saveRoadToDB(feature);
    }
  }

  saveRoadToDB(feature: Feature) {
    const geometryModel = new Geometry(feature.geometry.type, feature.geometry.coordinates);
    const properties = new PropertiesFromDB(feature.properties.highway, feature.properties.surface, feature.properties.oneway, feature.properties.lanes, 'road');
    const object =  new FeatureFromDB(feature.id, 'Feature', geometryModel, properties);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(this.roadHttp, object, {headers}).subscribe();
  }

  saveObjectsToDB(features: [Feature]) {
    for (const feature of features) {
      this.saveObjectToDB(feature);
    }
  }

  saveObjectToDB(feature: Feature) {
    const geometryModel = new Geometry(feature.geometry.type, feature.geometry.coordinates);
    const properties = new PropertiesFromDB(feature.properties.highway, '', '', '', feature.properties.description);
    const object =  new FeatureFromDB(feature.id, 'Feature', geometryModel, properties);
    console.log(object);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(this.objectHttp, object, {headers}).subscribe();
  }

  saveCustomMarkerToDB(marker: CustomMarker) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(this.customMarkerHttp, marker, {headers}).subscribe();
  }

  loadDataFromDB(url: string) {
    return this.http.get(url);
  }

  // saveAllDataToDB(onlyStreetFeatures: [Feature], objectFeatures: [Feature]) {
  //   this.saveRoadsToDB(onlyStreetFeatures);
  //   this.saveObjectsToDB(objectFeatures);
  // }
}
