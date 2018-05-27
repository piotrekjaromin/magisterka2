import {Geojsonmodel} from '../models/geojsonmodel';
import {GeometryOperations} from '../calculationOperations/geometryOperations';
import {LayerGroup, Marker} from 'leaflet';
import {BaseLayerManager} from '../layerManagers/baseLayerManager';
import {Feature} from '../models/feature';
import {SpeedService} from '../services/speed.service';
import {isArray, isNumber} from 'util';
import {Mathematical} from '../calculationOperations/mathematical';
import {CustomMarker} from '../models/customMarker';

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

  public static finishedSpeedLayer(allStreetWithObjects: Geojsonmodel, objects: [Feature]) {
    const markers: [Marker] = <[Marker]>[];
    const streetTmp: [Feature] = <[Feature]>[];
    console.log(objects);
    let counter = 0;

    for (const street of allStreetWithObjects.features) {
      // jeśli droga jest krótsza niż 50m, nie ustawia znaku
      if (Mathematical.getDistanceBetweenPointAndEndOfRoad(street.geometry.coordinates[0], street.geometry.coordinates) > 50) {
        for (const markerTmp of this.prepareMarkersOfBeginningStreet(street, objects)) {
          markers.push(markerTmp);
        }
        this.sortMarkersOfStreet(street);
        streetTmp.push(street);
        for (const marker of street.markers) {
          const lat = this.getNumberFromType(marker.lat);
          const long = this.getNumberFromType(marker.long);
          // jeśli domyślna pr ̨edkość jest mniejsza badz równa ograniczeniu pr ̨edkości wymaganym przez obiekt typu przejście dla pieszych,
          // szkoła, zakr̨et itp, nie ustawia znaku
          if (Number(street.properties.defaultSpeedLimit) > marker.speed) {
            // jeśli droga lub jej fragment znajduj a  ̨ si ̨e w strefie ograniczonej pr̨edkości, to wewnatrz tej strefy nie sa
            // ̨ustawiane żadne inne ograniczenia pr ̨edkości.
            if (!this.checkIfMarkerInsideRectangle(marker, objects)) {
              if (counter > 0) {
                const distanceBetweenObjectAndPrevious = Mathematical.getDistanceBetweenPointAndEndOfRoad([this.getNumberFromType(street.markers[counter - 1].lat), this.getNumberFromType(street.markers[counter - 1].long)], street.geometry.coordinates) - Mathematical.getDistanceBetweenPointAndEndOfRoad([lat, long], street.geometry.coordinates);
                let distanceBetweenObjectAndNext;
                if (counter >= street.markers.length - 1) {
                  distanceBetweenObjectAndNext = Mathematical.getDistanceBetweenPointAndEndOfRoad([this.getNumberFromType(street.markers[counter].lat), this.getNumberFromType(street.markers[counter - 1].long)], street.geometry.coordinates);
                } else {
                  distanceBetweenObjectAndNext = Math.abs(Mathematical.getDistanceBetweenPointAndEndOfRoad([this.getNumberFromType(street.markers[counter].lat), this.getNumberFromType(street.markers[counter].long)], street.geometry.coordinates) - Mathematical.getDistanceBetweenPointAndEndOfRoad([this.getNumberFromType(street.markers[counter + 1].lat), this.getNumberFromType(street.markers[counter + 1].long)], street.geometry.coordinates));
                }

                console.log(distanceBetweenObjectAndNext);
                if ( Number(street.properties.defaultSpeedLimit) <= 60) {
                  if (distanceBetweenObjectAndPrevious > 50) {
                    const coordinates = GeometryOperations.getCoordinatesBeforePoint([lat, long], street.geometry.coordinates, 50);
                    markers.push(
                      BaseLayerManager.prepareMarker(coordinates[1], coordinates[0], '' + marker.speed)
                        .on('click', (data) => console.log(street)));
                  }
                  if (distanceBetweenObjectAndNext > 50) {
                    const coordinates = GeometryOperations.getCoordinatesAfterPoint([lat, long], street.geometry.coordinates, 10);
                    markers.push(
                      BaseLayerManager.prepareMarker(coordinates[1], coordinates[0], '' + marker.speed)
                        .on('click', (data) => console.log(street)));
                  }
                } else {
                  if (distanceBetweenObjectAndPrevious > 150) {
                    const coordinates = GeometryOperations.getCoordinatesBeforePoint([lat, long], street.geometry.coordinates, 150);
                    markers.push(
                      BaseLayerManager.prepareMarker(coordinates[1], coordinates[0], '' + marker.speed)
                        .on('click', (data) => console.log(street)));
                  }
                  if (distanceBetweenObjectAndNext > 150) {
                    const coordinates = GeometryOperations.getCoordinatesAfterPoint([lat, long], street.geometry.coordinates, 10);
                    markers.push(
                      BaseLayerManager.prepareMarker(coordinates[1], coordinates[0], '' + marker.speed)
                        .on('click', (data) => console.log(street)));
                  }
                }
              }
            }
          }
         counter = counter + 1;
        }
      }
      counter = 0;
    }
    return new Map()
      .set('finished speed', new LayerGroup(markers))
      .set('finished speed street', BaseLayerManager.parseGeoJsonToGeojsonmodel(new Geojsonmodel('FeatureCollection', streetTmp)));
  }

  private static getNumberFromType(number: any) {
    if (isNumber(number)) {
      return number;
    } else if (isArray(number) && number.length > 0) {
      return this.getNumberFromType(number[0]);
    }
    return 0;
  }

  private static sortMarkersOfStreet(street: Feature) {
    const result = new Map();
    let flag = 1;
    while (flag > 0) {
      flag = 0;
      for (let i = 0; i < street.markers.length - 1; i++) {
        const first = Mathematical.getDistanceBetweenPointAndEndOfRoad([street.markers[i].lat, street.markers[i].long], street.geometry.coordinates);
        const second = Mathematical.getDistanceBetweenPointAndEndOfRoad([street.markers[i + 1].lat, street.markers[i + 1].long], street.geometry.coordinates);
        if (first < second) {
          const temp = street.markers[i + 1];
          street.markers[i + 1] = street.markers[i];
          street.markers[i] = temp;
          flag++;
        }
      }
    }

    for (const marker of street.markers) {
      result.set(marker, Mathematical.getDistanceBetweenPointAndEndOfRoad([marker.lat, marker.long], street.geometry.coordinates));
    }
  }

  private static checkIfMarkerInsideRectangle(marker: CustomMarker, objects: [Feature]) {
    if (marker.type.includes('start') || marker.type.includes('end') || marker.speed === 0) {
      return false;
    }
    let flag = false;
    for (const object of objects) {
      if (object.geometry.type === 'Polygon') {
        const lat = this.getNumberFromType(marker.lat);
        const long = this.getNumberFromType(marker.long);
        if (Mathematical.checkIfPointInRectangle([lat, long], object.geometry.coordinates) === true ) {
          flag = true;
        }
      }
    }
    return true;
  }

  private static prepareMarkersOfBeginningStreet(street: Feature, objects: [Feature]) {
    const markers: [Marker] = <[Marker]>[];


    for (const object of objects) {
      if (object.geometry.type === 'Polygon' && Mathematical.checkIfPointInRectangle(street.geometry.coordinates[0], object.geometry.coordinates)) {
        return markers;
      }
    }
     if (street.markers.length === 0) {
       markers.push(
         BaseLayerManager.prepareMarker(street.geometry.coordinates[0][1], street.geometry.coordinates[0][0], '' + street.properties.defaultSpeedLimit)
           .on('click', (data) => console.log(street)));
       return markers;
     }
    const lat = this.getNumberFromType(street.markers[0].lat);
    const long = this.getNumberFromType(street.markers[0].long);
    const distanceFromBeginningStreetToFirstMarker = Mathematical.getDistanceBetweenPointAndEndOfRoad(street.geometry.coordinates[0], street.geometry.coordinates) -
      Mathematical.getDistanceBetweenPointAndEndOfRoad([lat, long], street.geometry.coordinates);
    if (Number(street.properties.defaultSpeedLimit) <= 60 ) {
      if (distanceFromBeginningStreetToFirstMarker <= 50) {
        markers.push(
          BaseLayerManager.prepareMarker(street.geometry.coordinates[0][1], street.geometry.coordinates[0][0], '' + street.markers[0].speed)
            .on('click', (data) => console.log(street)));
      } else {
        markers.push(
          BaseLayerManager.prepareMarker(street.geometry.coordinates[0][1], street.geometry.coordinates[0][0], '' + street.properties.defaultSpeedLimit)
            .on('click', (data) => console.log(street)));
        markers.push(
          BaseLayerManager.prepareMarker(long, lat, '' + street.markers[0].speed)
            .on('click', (data) => console.log(street)));
      }
    } else {
      if (distanceFromBeginningStreetToFirstMarker <= 150) {
        markers.push(
          BaseLayerManager.prepareMarker(street.geometry.coordinates[0][1], street.geometry.coordinates[0][0], '' + street.markers[0].speed)
            .on('click', (data) => console.log(street)));
      } else {
        markers.push(
          BaseLayerManager.prepareMarker(street.geometry.coordinates[0][1], street.geometry.coordinates[0][0], '' + street.properties.defaultSpeedLimit)
            .on('click', (data) => console.log(street)));
        markers.push(
          BaseLayerManager.prepareMarker(long, lat, '' + street.markers[0].speed)
            .on('click', (data) => console.log(street)));
      }
    }
    return markers;
  }

}
