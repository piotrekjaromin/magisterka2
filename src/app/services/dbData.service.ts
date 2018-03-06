import {Injectable} from '@angular/core';
import { HttpHeaders, HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Feature} from '../models/feature';
import {PropertiesFromDB} from '../models/propertiesFromDB';
import {Geometry} from '../models/geometry';
import {FeatureFromDB} from '../models/featureFromDB';
import {SimpleObject} from '../models/simpleObject';

@Injectable()
export class DbDataService {
  public roadHttp = 'http://localhost:5000/roads';
  public objectHttp = 'http://localhost:5000/objects';

  constructor(private http: HttpClient) {}

  saveRoadsToDB(features: [Feature]) {
    for (const feature of features) {
      this.saveRoadToDB(feature);
    }
  }

  saveRoadToDB(feature: Feature) {
    const geometryModel = new Geometry(feature.geometry.type, feature.geometry.coordinates);
    const propertiesModel = new PropertiesFromDB(feature.properties.highway, feature.properties.surface);
    const object =  new FeatureFromDB(feature.id, feature.type, propertiesModel, geometryModel, feature.markers);
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
    const object = new SimpleObject(feature.id, feature.type, geometryModel);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(this.objectHttp, object, {headers}).subscribe();
  }

  loadDataFromDB(url: string) {
    return this.http.get(url);
  }

  saveAllDataToDB(onlyStreetFeatures: [Feature], objectFeatures: [Feature]) {
    this.saveRoadsToDB(onlyStreetFeatures);
    this.saveObjectsToDB(objectFeatures);
  }
}
