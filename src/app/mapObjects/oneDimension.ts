import {Mathematical} from '../calculationOperations/mathematical';
import {SpeedService} from '../services/speed.service';
import {CustomMarker} from '../models/customMarker';
import {Geojsonmodel} from '../models/geojsonmodel';
import {DataService} from '../services/data.service';
import {Feature} from '../models/feature';
import {icon, LayerGroup, marker, Marker} from 'leaflet';
import {GeometryOperations} from '../calculationOperations/geometryOperations';
import {BaseLayerManager} from '../layerManagers/baseLayerManager';

export class OneDimension {

  public static addAllObjectsToStreets(dataService: DataService, data: any): Geojsonmodel {
    const allStreets: Geojsonmodel = dataService.getOnlyStreet(data);
    this.insertObjectsToStreets(allStreets, dataService.getTrafficSignal(data), '50');
    this.insertObjectsToStreets(allStreets, dataService.getRailCrossing(data), '30');
    this.insertObjectsToStreets(allStreets, dataService.getPedestrialCrossing(data), '30');
    this.insertDefaultSpeedLimitToStreets(allStreets);
    return allStreets;
  }

  private static insertObjectsToStreets(streets: Geojsonmodel, objects: Geojsonmodel, speed: string) {
    const objectFeatures = objects.features;
    const streetFeatures: Geojsonmodel = streets;

    for (const objectFeature of objectFeatures) {
      for (const streetFeature of streetFeatures.features) {
        const streetContainsObject = Mathematical.pointInRectangle(streetFeature.geometry.coordinates, <any>objectFeature.geometry.coordinates);
        if (streetContainsObject) {
          const customMarker = new CustomMarker(<any>objectFeature.geometry.coordinates[0], <any>objectFeature.geometry.coordinates[1], objectFeature.properties.description, Number(speed));

          if (streetFeature.markers === undefined) {
            const customMarkers: [CustomMarker] = <[CustomMarker]>[];
            customMarkers.push(customMarker);
            streetFeature.markers = customMarkers;
          } else {
            streetFeature.markers.push(customMarker);
          }
        }
      }
    }
    return streetFeatures;
  }

  private static insertDefaultSpeedLimitToStreets(allStreets: Geojsonmodel) {
    for (const feature of allStreets.features) {
      feature.properties.defaultSpeedLimit = SpeedService.getMaxSpeed(feature).toString();
    }
  }

  public static getStreetsContains(type: string, allStreetWithObjects: Geojsonmodel) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);

    for (const feature of allStreetWithObjects.features) {
      if (feature.markers === undefined) {
        continue;
      }
      for (const marker2 of feature.markers) {
        if (marker2.type === type) {
          result.features.push(feature);
          break;
        }
      }
    }
    return result;
  }

  public static prepareSpeedLimitBeforeBeforeAndAfterMarkersLayer(type: string, allStreetWithObjects: Geojsonmodel): LayerGroup {
    const markers: [Marker] = <[Marker]>[];
    const onlyStreetGeoModel: Geojsonmodel = OneDimension.getStreetsContains(type, allStreetWithObjects);
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      for (const customMarker of feature.markers) {
        if (+feature.properties.defaultSpeedLimit > customMarker.speed) {

          const beforeCoordinates = GeometryOperations.getCoordinatesBeforePoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 50);

          markers.push(
            this.prepareMarker(beforeCoordinates[1], beforeCoordinates[0], feature.markers[0].speed.toString())
              .on('click', (data) => console.log(1)));

          // if (Mathematical.getDistanceBetweenPointAndEndOfRoad([customMarker.lat, customMarker.long], Mathematical.revertCoordinates(feature.geometry.coordinates)) > 100) {
          const afterCoordinates = GeometryOperations.getCoordinatesAfterPoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 10);

          markers.push(
            this.prepareMarker(afterCoordinates[1], afterCoordinates[0], feature.properties.defaultSpeedLimit)
              .on('click', (data) => console.log(2)));
          // }
        }
      }
    }
    return new LayerGroup(markers);
  }

  public static prepareObjectMarkersLayer(type: string, allStreetWithObjects: Geojsonmodel): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    for (const markerFeature of this.getMarkers(type, allStreetWithObjects)) {
      markers.push(
        this.prepareMarker(markerFeature.long, markerFeature.lat, type)
          .on('click', (data) => console.log(type)));
    }
    return new LayerGroup(markers);
  }

  private static prepareMarker(lat: number, long: number, markerName: string) {
    let iconSize;

    if (markerName === 'pedestrian_crossing' || markerName === 'traffic_signals') {
      iconSize = 16;
    } else {
      iconSize = 25;
    }

    return marker([lat, long], {
      icon: icon({
        iconSize: [iconSize, iconSize],
        iconAnchor: [0, 0],
        iconUrl: 'assets/' + markerName + '.png'
      })
    });
  }

  private static getMarkers(type: string, allStreetWithObjects: Geojsonmodel) {
    const result: [CustomMarker] = <[CustomMarker]>[];

    for (const feature of allStreetWithObjects.features) {
      if (feature.markers === undefined) {
        continue;
      }
      for (const markerFeature of feature.markers) {
        if (markerFeature.type === type) {
          result.push(markerFeature);
        }
      }
    }
    return result;
  }

  public static createLayers(types: [string], allStreetWithObjects: Geojsonmodel) {
    const result = new Map();

    for (const type of types) {
      result
      .set(type, this.prepareObjectMarkersLayer(type, allStreetWithObjects))
      .set(type + ' street', BaseLayerManager.parseGeoJsonToGeojsonmodel(this.getStreetsContains(type, allStreetWithObjects)))
      .set(type + ' speed', OneDimension.prepareSpeedLimitBeforeBeforeAndAfterMarkersLayer(type, allStreetWithObjects));
    }
  return result;
  }
}
