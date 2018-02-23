import {FeatureFromDB} from './featureFromDB';

export class GeojsonFromDbModel {
  constructor(public type: string,
              public features: [FeatureFromDB]) {}
}
