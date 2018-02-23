import {Injectable} from '@angular/core';


import { HttpHeaders, HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Feature} from '../models/feature';
import {CustomMarker} from '../models/customMarker';
import {PropertiesFromDB} from '../models/propertiesFromDB';
import {Geometry} from '../models/geometry';
import {FeatureFromDB} from '../models/featureFromDB';

@Injectable()
export class DbDataService {
  roadHttp = 'http://localhost:5000/roads';

  constructor(private http: HttpClient) {}

  saveRoadToDB(feature: Feature, markers: [CustomMarker]) {
    const geometryModel = new Geometry(feature.geometry.type, feature.geometry.coordinates);
    const propertiesModel = new PropertiesFromDB(feature.properties.highway, feature.properties.surface);
    const road =  new FeatureFromDB(feature.id, feature.type, propertiesModel, geometryModel, markers);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(this.roadHttp, road, {headers}).subscribe();
  }

  loadRoadsFromDB() {
    return this.http.get(this.roadHttp);
  }
}
