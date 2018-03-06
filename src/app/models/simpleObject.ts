import {Geometry} from './geometry';

export class SimpleObject {
  constructor(public id: string,
              public type: string,
              public geometry: Geometry
  ) {}
}
