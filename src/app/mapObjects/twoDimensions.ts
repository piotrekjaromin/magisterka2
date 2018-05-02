import {Geojsonmodel} from '../models/geojsonmodel';
import {DataService} from '../services/data.service';
import {Feature} from '../models/feature';
import {BaseLayerManager} from '../layerManagers/baseLayerManager';
import {BoundingBox} from '../calculationOperations/boundingBox';

export class TwoDimensions {

  public static prepare2dObjects(dataService: DataService, data: any): Geojsonmodel {
    const all2dObjects = dataService.getBusStops(data);
    this.insert2dObjects(all2dObjects, dataService.getSchools(data));
    this.insert2dObjects(all2dObjects, dataService.getSchools(data));
    this.insert2dObjects(all2dObjects, dataService.getShopsAndChurches(data));
    return all2dObjects;
  }

  private static  insert2dObjects(allObjects: Geojsonmodel, oneTypeObject: Geojsonmodel) {
    for (const feature of oneTypeObject.features) {
      allObjects.features.push(feature);
    }
    return allObjects;
  }

  public static getObject(objects: Geojsonmodel, description: string) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);
    for (const feature of objects.features) {
      if (feature.properties.description === description) {
        result.features.push(feature);
      }
    }
    return result;
  }

  public static createLayers(types: [[string, number]], all2dObjects: Geojsonmodel, allStreetWithObjects: Geojsonmodel) {
    const result = new Map();

    for (const type of types) {
      result
        .set(type[0], BaseLayerManager.parseGeoJsonToGeojsonmodel(this.getObject(all2dObjects, type[0])))
        .set(type[0] + ' bounding box', BaseLayerManager.parseGeoJsonToGeojsonmodel(BoundingBox.getCombinedBoundingBox(TwoDimensions.getObject(all2dObjects, type[0]), type[1])))
        .set(type[0] + ' street', BoundingBox.getStreetContainsBoundingBox(TwoDimensions.getObject(all2dObjects, type[0]), type[1], allStreetWithObjects.features));
    }
    return result;
  }
}
