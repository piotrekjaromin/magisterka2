import {Properties} from './properties';
import {Geometry} from './geometry';
import {CustomMarker} from './models/customMarker';

export class Feature {
  constructor(public type: string,
              public id: string,
              public properties: Properties,
              public geometry: Geometry,
              public markers: [CustomMarker]
  ) {}
}
