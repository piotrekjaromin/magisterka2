import {Geometry} from './geometry';
import {CustomMarker} from './customMarker';
import {Properties} from './properties';
import {PropertiesFromDB} from './propertiesFromDB';

export class FeatureFromDB {
  constructor(public id: string,
              public type: string,
              public properties: PropertiesFromDB,
              public geometry: Geometry,
              public markers: [CustomMarker]
  ) {}
}
