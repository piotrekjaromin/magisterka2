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

  public static getObject(objects: Geojsonmodel, description: string) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);
    let counter = 0;
    for (const feature of objects.features) {
      if (feature.properties.description === description) {
        counter++;
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
        .set(type[0] + ' bounding box', BaseLayerManager.parseGeoJsonToGeojsonmodel(BoundingBox.getCombinedBoundingBox(this.getObject(all2dObjects, type[0]), type[1])))
        .set(type[0] + ' street', BoundingBox.getStreetContainsBoundingBox(this.getObject(all2dObjects, type[0]), type[1], allStreetWithObjects.features));
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
    console.log(features);

    for (const feature of features) {
      for (const customMarker of feature.markers) {
        if (customMarker.type === type) {
          markers.push(
            BaseLayerManager.prepareMarker(customMarker.long, customMarker.lat, '20')
              .on('click', (data) => customMarker));
        }
      }
    }
    return new LayerGroup(markers);
  }

  public static add2dObjectToStreet(type: string, streets: Geojsonmodel, distance: number, all2dObjects: Geojsonmodel) {
    let result = false;
    let description = '';
    const boundingBoxObjects = BoundingBox.getCombinedBoundingBox(TwoDimensions.getObject(all2dObjects, type), distance);
    const boundingBoxesNotCombined = BoundingBox.getBoundingBox(TwoDimensions.getObject(all2dObjects, type), distance);
    for (const street of streets.features) {
      for (const boundingBoxObject of boundingBoxObjects.features) {
        const numberOfCrossPoint = Mathematical.getCrossPointOfRoadAndRectangle(street.geometry, boundingBoxObject.geometry);
        for (const point of numberOfCrossPoint) {
          const coordinatesAfter = GeometryOperations.calculateCoordinatesBetweenPoint(street.geometry.coordinates, point);
          for (const notCombined of boundingBoxesNotCombined.features) {
            if (Mathematical.checkIfPointInRectangle(<any>coordinatesAfter, notCombined.geometry.coordinates)) {
              result = true;
            }
          }
          if (result) {
            description = type + '_start';
          } else {
            description = type + '_end';
          }
          result = false;

          const customMarker = new CustomMarker(point[0], <any>point[1], description, Number(10));
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
}
