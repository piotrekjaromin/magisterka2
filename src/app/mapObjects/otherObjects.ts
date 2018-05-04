import {Geojsonmodel} from '../models/geojsonmodel';
import {GeometryOperations} from '../calculationOperations/geometryOperations';
import {LayerGroup, Marker} from 'leaflet';
import {BaseLayerManager} from '../layerManagers/baseLayerManager';
import {Feature} from '../models/feature';
import {SpeedService} from '../services/speed.service';

export class OtherObjects {
  public static getNumberOfLaneLayer(allStreetWithObjects: Geojsonmodel) {
    const markers: [Marker] = <[Marker]>[];
    for (const feature of allStreetWithObjects.features) {
      if (this.getNumberOfLane(feature) > '1') {
        const coordinates = GeometryOperations.getCenterCoordinatesOfTheRoad(feature.geometry.coordinates);
        markers.push(
          BaseLayerManager.prepareMarker(coordinates[0], coordinates[1], this.getNumberOfLane(feature) + '_lanes')
            .on('click', (data) => console.log(feature)));
      }
    }
    return new LayerGroup(markers);
  }

  public static prepareSpeedLimitWithLaneMarkersLayer(allStreetWithObjects: Geojsonmodel) {
    const markers: [Marker] = <[Marker]>[];

    for (const feature of allStreetWithObjects.features) {
      let speedLimit = feature.properties.defaultSpeedLimit;

      if (this.getNumberOfLane(feature) > '1') {
        speedLimit = '' + (+speedLimit + 10);
      }
      const coordinates = GeometryOperations.getBeginningCoordinates(feature.geometry.coordinates);
      markers.push(
        BaseLayerManager.prepareMarker(coordinates[1], coordinates[0], speedLimit)
          .on('click', (data) => console.log(data)));
    }
    return new LayerGroup(markers);
  }

  private static getNumberOfLane(feature: Feature): string {
    let numberOfLanes = '1';
    if (feature.properties.lanes !== undefined) {
      if (feature.properties.oneway !== 'yes') {
        numberOfLanes = '' + Math.ceil((+numberOfLanes) / 2);
      } else {
        numberOfLanes = '' + feature.properties.lanes;
      }
    }
    return numberOfLanes;
  }

  public static prepareOtherLayers(allStreetWithObjects: Geojsonmodel) {
    return new Map()
      .set('number of lanes', this.getNumberOfLaneLayer(allStreetWithObjects))
      .set('number of lanes speed', this.prepareSpeedLimitWithLaneMarkersLayer(allStreetWithObjects))
      .set('type of road speed', this.getTypeOfRoadLayer(allStreetWithObjects));
  }

  public static getTypeOfRoadLayer(allStreetWithObjects: Geojsonmodel) {
    const markers: [Marker] = <[Marker]>[];
    for (const feature of allStreetWithObjects.features) {
      const coordinates = GeometryOperations.getCenterCoordinatesOfTheRoad(feature.geometry.coordinates);
      markers.push(
        BaseLayerManager.prepareMarker(coordinates[0], coordinates[1], '' + SpeedService.getMaxSpeedByStreetType(feature))
          .on('click', (data) => console.log(feature)));
    }
    return new LayerGroup(markers);
  }
}
