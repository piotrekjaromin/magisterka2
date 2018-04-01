import {Mathematical} from './mathematical';
import {MapDataOperations} from '../mapDataOperations';

export class GeometryOperations {
  public static getCoordinatesBeforePoint(point: [number, number], streetCoordinates: [[number, number]], distanceBefore: number): [number, number] {
    for (let i = 0; i < streetCoordinates.length - 1; i++) {
      if ( Mathematical.isBetweenPoint(streetCoordinates[i][0], streetCoordinates[i + 1][0], point[0])
        && Mathematical.isBetweenPoint(streetCoordinates[i][1], streetCoordinates[i + 1][1], point[1])) {

        let distanceBetweenPoints = Mathematical.distanceBetweenPoints([streetCoordinates[i][0], streetCoordinates[i][1]], point);

        while (true) {
          if (distanceBetweenPoints >= distanceBefore) {
            const x1 = streetCoordinates[i][0];
            const y1 = streetCoordinates[i][1];
            const x2 = streetCoordinates[i + 1][0];
            const y2 = streetCoordinates[i + 1][1];

            const distance = Mathematical.distanceBetweenPoints([x1, y1], [x2, y2]);

            const x0 = x2 - ( (distanceBefore * (x2 - x1)) / distance);
            const y0 = y2 - ( (distanceBefore * (y2 - y1)) / distance);
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

  public static getCoordinatesAfterPoint(point: [number, number], streetCoordinates: [[number, number]], distanceAfter: number): [number, number] {
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
}
