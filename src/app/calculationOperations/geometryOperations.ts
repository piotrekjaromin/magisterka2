import {Mathematical} from './mathematical';
import {MapDataOperations} from '../mapDataOperations';
import {Feature} from '../models/feature';
import {DataService} from '../services/data.service';

export class GeometryOperations {
  public static getCoordinatesBeforePoint2(point: [number, number], streetCoordinates: [[number, number]], distanceBefore: number): [number, number] {
    for (let i = 0; i < streetCoordinates.length - 1; i++) {
      if (Mathematical.isBetweenPoint(streetCoordinates[i][0], streetCoordinates[i + 1][0], point[0])
        && Mathematical.isBetweenPoint(streetCoordinates[i][1], streetCoordinates[i + 1][1], point[1])) {

        let distanceBetweenPoints = Mathematical.distanceBetweenPoints([streetCoordinates[i][0], streetCoordinates[i][1]], point);

        while (true) {
          if (distanceBetweenPoints >= distanceBefore) {
            const x1 = streetCoordinates[i][0];
            const y1 = streetCoordinates[i][1];
            const x2 = streetCoordinates[i + 1][0];
            const y2 = streetCoordinates[i + 1][1];

            const distance = Mathematical.distanceBetweenPoints([x1, y1], [x2, y2]);

            const x0 = x2 - ((distanceBefore * (x2 - x1)) / distance);
            const y0 = y2 - ((distanceBefore * (y2 - y1)) / distance);
            return [x0, y0];
          } else {
            distanceBefore = distanceBefore - distanceBetweenPoints;
            if (i === 0) {
              return this.getBeginningCoordinates(streetCoordinates);
            } else {
              distanceBetweenPoints = Mathematical.distanceBetweenPoints(
                [streetCoordinates[i - 1][0], streetCoordinates[i - 1][1]],
                [streetCoordinates[i][0], streetCoordinates[i][1]]);
              i = i - 1;
            }
          }
        }
      }
    }
    return [-1, -1];
  }

  public static getCoordinatesAfterPoint2(point: [number, number], streetCoordinates: [[number, number]], distanceAfter: number): [number, number] {
    const reversedCoordinates = Mathematical.revertCoordinates(streetCoordinates);
    return this.getCoordinatesBeforePoint(point, reversedCoordinates, distanceAfter);
  }


  public static getBeginningCoordinates(coordinates: [[number, number]]): [number, number] {
    return [coordinates[0][0], coordinates[0][1]];
  }

  public static getCenterCoordinatesOfTheRoad(coordinates: [[number, number]]): [number, number] {
    const arrayOfLengths = MapDataOperations.getStreetLength(coordinates);
    const totalLengthOfStreet = arrayOfLengths[arrayOfLengths.length - 3];

    let currentLength = 0;
    for (let i = 0; i < arrayOfLengths.length; i += 3) {
      currentLength += arrayOfLengths[i];
      if (currentLength >= (totalLengthOfStreet / 2)) {
        return [arrayOfLengths[i + 1], arrayOfLengths[i + 2]];
      }
    }
    console.log('Error computing center of the road');
  }

  public static getBoundingBox(feature: Feature, distanceInMeters: number): [[number, number]] {
    const distanceInDegree = DataService.metersToCoordinates(distanceInMeters);
    let minLong = 9999;
    let maxLong = 0;
    let minLat = 9999;
    let maxLat = 0;
    for (const coordinates of feature.geometry.coordinates) {
      for (const coordinate of coordinates) {

        if (minLong > coordinate[0]) { minLong = coordinate[0]; }

        if (maxLong < coordinate[0]) { maxLong = coordinate[0]; }

        if (minLat > coordinate[1]) { minLat = coordinate[1]; }

        if (maxLat < coordinate[1]) { maxLat = coordinate[1]; }

      }
    }
    minLong = minLong - distanceInDegree;
    maxLong = maxLong + distanceInDegree;
    minLat = minLat - distanceInDegree;
    maxLat = maxLat + distanceInDegree;
    return [[minLong, minLat], [maxLong, minLat], [maxLong, maxLat], [minLong, maxLat], [minLong, minLat]];
  }

  public static getCoordinatesAfterPoint(point: [number, number], streetCoordinates: [[number, number]], distanceInMeters: number) {
    for (let i = 0; i < streetCoordinates.length - 1; i++) {
      if (Mathematical.checkIfPointIsBetweenPoints(streetCoordinates[i], streetCoordinates[i + 1], point)) {
        while (true) {
          if (Mathematical.distanceBetweenPoints(point, streetCoordinates[i + 1]) >= distanceInMeters) {
            return this.getCoordinatesOfPointAfterDistance(point, streetCoordinates[i + 1], distanceInMeters);
          } else {
            if (i >= streetCoordinates.length - 2) {
              return streetCoordinates[streetCoordinates.length - 1];
            }
            distanceInMeters = distanceInMeters - Mathematical.distanceBetweenPoints(point, streetCoordinates[i + 1]);
            i = i + 1;
            point = streetCoordinates[i];
          }
        }
        // console.log('distance: ' + distanceInMeters + ' ' +Mathematical.distanceBetweenPoints(streetCoordinates[i], result));
      }
    }
    console.log('error')
    return [-1, -1];
  }

  public static getCoordinatesBeforePoint(point: [number, number], streetCoordinates: [[number, number]], distanceAfter: number): [number, number] {
    const reversedCoordinates = Mathematical.revertCoordinates(streetCoordinates);
    return this.getCoordinatesAfterPoint(point, reversedCoordinates, distanceAfter);
  }

  private static getCoordinatesOfPointAfterDistance(coordinatesFrom: [number, number], coordinatesTo: [number, number], distanceInMeters: number) {
    let pointFrom = coordinatesFrom;
    let pointTo = coordinatesTo;
    let result;
    let distance;
    let counter = 0;
    while ( true ) {
      counter++;
      result = this.getMidpointBetweenTwoPoint(pointFrom, pointTo);
      distance = Mathematical.distanceBetweenPoints(<any>pointFrom, <any>result);
      if (distance <= distanceInMeters + 0.1 && distance >= distanceInMeters) {
        console.log('finish');
        return result;
      } else if (distance >= distanceInMeters + 0.1 ) {
        console.log('+');
        pointTo = <any>result;
      } else if (distance < distanceInMeters - 0.1) {
        console.log('-');
        pointFrom = <any>result;
        distanceInMeters = distanceInMeters - distance;
      }
      if (counter > 50) {
        return result;
      }
    }
  }

  public static getMidpointBetweenTwoPoint(pointFrom: [number, number], pointTo: [number, number]) {
    const xResult = (pointFrom[0] + pointTo[0]) / 2;
    const yResult = (pointFrom[1] + pointTo[1]) / 2;
    return [xResult, yResult];
  }

}
