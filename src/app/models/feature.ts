import {Geometry} from './geometry';
import {CustomMarker} from './customMarker';
import {Properties} from './properties';

export class Feature {
  constructor(public id: string,
              public type: string,
              public properties: Properties,
              public geometry: Geometry,
              public markers: [CustomMarker]
  ) {}
}
