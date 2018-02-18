import {CustomMarker} from './customMarker';
import {PropertiesModel} from './propertiesModel';
import {GeometryModel} from './geometryModel';

export class Road {
  constructor(public id: string,
              public type: string,
              public properties: PropertiesModel,
              public geometry: GeometryModel,
              public markers: [CustomMarker]
  ) {}
}
