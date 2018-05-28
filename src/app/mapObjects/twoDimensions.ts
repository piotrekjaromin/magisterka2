import {Geojsonmodel} from '../models/geojsonmodel';
import {DataService} from '../services/data.service';
import {Feature} from '../models/feature';
import {BaseLayerManager} from '../layerManagers/baseLayerManager';
import {BoundingBox} from '../calculationOperations/boundingBox';
import {Mathematical} from '../calculationOperations/mathematical';
import {CustomMarker} from '../models/customMarker';
import {GeometryOperations} from '../calculationOperations/geometryOperations';
import {LayerGroup, Marker} from 'leaflet';
import {OneDimension} from './oneDimension';

export class TwoDimensions {

  public static prepare2dObjects(dataService: DataService, data: any): Geojsonmodel {
    const all2dObjects = dataService.getBusStops(data);
    this.insert2dObjects(all2dObjects, dataService.getSchools(data));
    this.insert2dObjects(all2dObjects, dataService.getShopsAndChurches(data));
    return all2dObjects;
  }

  private static insert2dObjects(allObjects: Geojsonmodel, oneTypeObject: Geojsonmodel) {
    for (const feature of oneTypeObject.features) {
      allObjects.features.push(feature);
    }
    return allObjects;
  }

  public static getObject(objects: [Feature], description: string) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);
    let counter = 0;
    for (const feature of objects) {
      feature.type = 'Feature';
      if (feature.properties.description === description) {
        counter++;
        result.features.push(feature);
      }
    }
    BaseLayerManager.parseGeoJsonToGeojsonmodel(result);
    return result;
  }

  public static createLayers(types: [[string, number]], allStreetWithObjects: [Feature], all2dObjects: [Feature]) {
    const result = new Map();
    for (const type of types) {
      result
        .set(type[0], BaseLayerManager.parseGeoJsonToGeojsonmodel(this.getObject(all2dObjects, type[0])))
        .set(type[0] + ' bounding box', BaseLayerManager.parseGeoJsonToGeojsonmodel(BoundingBox.getCombinedBoundingBox(this.getObject(all2dObjects, type[0]), type[1])))
        .set(type[0] + ' street', BaseLayerManager.parseGeoJsonToGeojsonmodel(BoundingBox.getStreetContainsBoundingBox(type[0], allStreetWithObjects)));
    }
    return result;
  }

  public static createLayersOnlyPoints(types: [string], allStreetWithObjects: Geojsonmodel) {
    const result = new Map();

    for (const type of types) {
      result
        .set(type + ' start', this.markerOnePoint(type + '_start', allStreetWithObjects))
        .set(type + ' end', this.markerOnePoint(type + '_end', allStreetWithObjects));
    }
    return result;
  }

  public static markerOnePoint(type: string, allStreetWithObjects: Geojsonmodel): LayerGroup {
    const markers: [Marker] = <[Marker]>[];
    const onlyStreetGeoModel: Geojsonmodel = OneDimension.getStreetsContains(type, allStreetWithObjects);
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      for (const customMarker of feature.markers) {
        if (customMarker.type === type) {
          let coordinates;
          if ( type.includes('start')) {
            if (+feature.properties.defaultSpeedLimit <= 60) {
              coordinates = GeometryOperations.getCoordinatesBeforePoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 50);
              customMarker.long = coordinates[1];
              customMarker.lat = coordinates[0];
            } else {
              coordinates = GeometryOperations.getCoordinatesBeforePoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 150);
              customMarker.long = coordinates[1];
              customMarker.lat = coordinates[0];
            }
          }
          markers.push(
            BaseLayerManager.prepareMarker(customMarker.long, customMarker.lat, '' + customMarker.speed)
              .on('click', (data) => console.log(customMarker)));
        }
      }
    }
    return new LayerGroup(markers);
  }

  public static add2dObjectToStreet(type: string, speed: number, streets: [Feature], distance: number, all2dObjects: [Feature]) {
    let result = false;
    const boundingBoxObjects = BoundingBox.getCombinedBoundingBox(TwoDimensions.getObject(all2dObjects, type), distance);
    const boundingBoxesNotCombined = BoundingBox.getBoundingBox(TwoDimensions.getObject(all2dObjects, type), distance);
    let counter = 0;
    for (const street of streets) {
      // if (speed >= +street.properties.defaultSpeedLimit) {
      //   continue;
      // }
      for (const boundingBoxObject of boundingBoxObjects.features) {
        const numberOfCrossPoint = Mathematical.getCrossPointOfRoadAndRectangle(street.geometry, boundingBoxObject.geometry);

        for (const point of numberOfCrossPoint) {
          const coordinatesAfter = GeometryOperations.getCoordinatesAfterPoint(point, street.geometry.coordinates, 10);

          for (const notCombined of boundingBoxesNotCombined.features) {
            if (Mathematical.checkIfPointInRectangle(<any>coordinatesAfter, notCombined.geometry.coordinates)) {
              result = true;
            }
          }
          const customMarker = this.prepareMarker(type, street, speed, result, point);
          counter = counter + 50;
          result = false;
          if (street.markers === undefined) {
            const customMarkers: [CustomMarker] = <[CustomMarker]>[];
            customMarkers.push(customMarker);
            street.markers = customMarkers;
          } else {
            street.markers.push(customMarker);
          }
        }
      }
      }
  }

  private static prepareMarker(type: string, street: Feature, speed: number, isStart: boolean, point: [number, number]) {
    let coordinates;
    if (isStart) {
      type = type + '_start';
      if (+street.properties.defaultSpeedLimit <= 60) {
        coordinates = GeometryOperations.getCoordinatesBeforePoint(point, street.geometry.coordinates, 10);
      } else {
        coordinates = GeometryOperations.getCoordinatesBeforePoint(point, street.geometry.coordinates, 10);
      }
    } else {
      speed = +street.properties.defaultSpeedLimit;
      type = type + '_end';
      coordinates = point;
     }
    return new CustomMarker(coordinates[0], coordinates[1], type, speed);
  }

}
