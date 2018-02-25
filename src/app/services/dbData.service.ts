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
  public static roadHttp = 'http://localhost:5000/roads';
  public static objectHttp = 'http://localhost:5000/objects';

  constructor(private http: HttpClient) {}

  saveObjectToDB(feature: Feature, markers: [CustomMarker], url: string) {
    const geometryModel = new Geometry(feature.geometry.type, feature.geometry.coordinates);
    const propertiesModel = new PropertiesFromDB(feature.properties.highway, feature.properties.surface);
    const object =  new FeatureFromDB(feature.id, feature.type, propertiesModel, geometryModel, markers);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    this.http.post(url, object, {headers}).subscribe();
  }

  loadObjectFromDB(url: string) {
    return this.http.get(url);
  }
}
