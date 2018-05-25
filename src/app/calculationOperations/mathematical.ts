import {DataService} from '../services/data.service';
import {Geometry} from '../models/geometry';

export class Mathematical {

  // traktujemy ulice jako prostokąt, poprzed
  public static pointInRectangle(streetCoordinates: [[number, number]], crossingCoordinates: [number, number], type: string) {
    // const array = <[number, number]>[]
    // if ( (<any>crossingCoordinates[0]).length === 1 ) {
    //   crossingCoordinates = [<number>crossingCoordinates[0][0], <number>crossingCoordinates[1][0]];
    //   array.push(<number>crossingCoordinates[0][0]);
    //   array.push(<number>crossingCoordinates[1][0]);
    //
    // }
    let result = 10000;
    for (let i = 1; i < streetCoordinates.length; i ++) {
      const distanceFromPointToLine =
        Mathematical.distanceBetweenPointAndStreet(streetCoordinates[i], streetCoordinates[i - 1], crossingCoordinates);
      const isBetween = Mathematical.checkIfPointIsBetweenPoints(streetCoordinates[i], streetCoordinates[i - 1], crossingCoordinates);
      if (distanceFromPointToLine < result && isBetween) {
        result = distanceFromPointToLine;
      }
    }
    if (type === 'addedByUser') {
      return result < 0.000009;
    } else {
      return result === 0;
    }
  }

  public static checkIfPointInRectangle(point: [number, number], rectangle: [[number, number]]) {

    if (rectangle[0][0][0] <= point[0] && point[0] <= rectangle[0][1][0]) {
      if (rectangle[0][0][1] <= point[1] && point[1] <= rectangle[0][2][1]) {
        return true;
      }
    }
    return false;
  }

  // https://stackoverflow.com/questions/910882/how-can-i-tell-if-a-point-is-nearby-a-certain-line
  public static distanceBetweenPointAndStreet(point1: [number, number], point2: [number, number],  point0: [number, number]) {
    const first = ((point2[0] - point1[0]) * (point1[1] - point0[1]) )
    const second = ( (point1[0] - point0[0]) * (point2[1] - point1[1]) );
    let licznik =  Math.abs(first - second);
    // licznik = licznik * 100;
    const mianownik = Math.sqrt( Math.pow((point2[0] - point1[0]), 2 ) + Math.pow((point2[1] - point1[1]), 2 ));
    const distance = licznik / mianownik;

    return distance;
  }

  public static distanceBetweenPoints(pointFrom: [number, number], pointTo: [number, number]) {
    var x1 = pointFrom[0];
    var y1 = pointFrom[1];
    var x2 = pointTo[0];
    var y2 = pointTo[1];
    return DataService.coordinatesToMeters(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
  }

  public static getDistanceBetweenPointAndEndOfRoad(point: [number, number], streetCoordinates: [[number, number]]) {
    let result = 0;
    for (let i = 0; i < streetCoordinates.length - 1; i++) {
      if (this.isBetweenPoint(streetCoordinates[i][0], streetCoordinates[i + 1][0], point[0])
        && this.isBetweenPoint(streetCoordinates[i][1], streetCoordinates[i + 1][1], point[1])) {

        result += this.distanceBetweenPoints(point, [streetCoordinates[i + 1][0], streetCoordinates[i + 1][1]]);

        for (let j = i + 1; j < streetCoordinates.length - 1; j++) {
          result += this.distanceBetweenPoints(
            [streetCoordinates[j][0], streetCoordinates[j][1]],
            [streetCoordinates[j + 1][0], streetCoordinates[j + 1][1]]);
        }
        return result;
      }
    }
    return result;
  }

  public static isBetweenPoint(from: number, to: number, toCheck: number): boolean {
    if (from <= toCheck && to >= toCheck) {
      return true;
    } else if (to <= toCheck && from >= toCheck) {
      return true;
    }
    return false;
  }

  public static revertCoordinates(coordinates: [[number, number]]): [[number, number]] {
    const reversedCoordinates: [[number, number]] = <[[number, number]]>[];
    for ( let i = coordinates.length - 1; i >= 0; i--) {
      reversedCoordinates.push(coordinates[i]);
    }
    return reversedCoordinates;
  }

  public static getCrossPointOfRoadAndRectangle(road: Geometry, rectangle: Geometry) {
    const result = <[[number, number]]>[];

    for (let i = 0; i < road.coordinates.length - 2; i++) {

      const x1 = road.coordinates[i][0];
      const y1 = road.coordinates[i][1];
      const x2 = road.coordinates[i + 1][0];
      const y2 = road.coordinates[i + 1][1];

      for (let j = 0; j < rectangle.coordinates[0].length - 1; j++) {
        const tmp = rectangle.coordinates[0];
        const x3 = tmp[j][0];
        const y3 = tmp[j][1];
        const x4 = tmp[j + 1][0];
        const y4 = tmp[j + 1][1];
        const crossPoint = this.getCrossPoint([[x1, y1], [x2, y2]], [[x3, y3], [x4, y4]]);
        if (this.checkIfPointIsBetweenPoints([x1, y1], [x2, y2], crossPoint) === true) {
          if (this.checkIfPointIsBetweenPoints([x3, y3], [x4, y4], crossPoint) === true) {
            result.push(crossPoint);
          }
        }
      }
    }
    return result;
  }

  public static getCrossPointOfRoadAndRectangle2(road: Geometry, rectangle: Geometry) {
    const result = <[[number, number]]>[];

    for (let i = 0; i < road.coordinates.length - 2; i++) {

      const x1 = road.coordinates[i][0];
      const y1 = road.coordinates[i][1];
      const x2 = road.coordinates[i + 1][0];
      const y2 = road.coordinates[i + 1][1];

      for (let j = 0; j < rectangle.coordinates[0].length - 2; j++) {
        const tmp = rectangle.coordinates[0];
        const x3 = tmp[j][0];
        const y3 = tmp[j][1];
        const x4 = tmp[j + 1][0];
        const y4 = tmp[j + 1][1];
        const crossPoint = this.getCrossPoint([[x1, y1], [x2, y2]], [[x3, y3], [x4, y4]]);
        if (this.checkIfPointIsBetweenPoints([x1, y1], [x2, y2], crossPoint) === true) {
          if (this.checkIfPointIsBetweenPoints([x3, y3], [x4, y4], crossPoint) === true) {
            result.push(crossPoint);
          }
        }
      }
    }
    return result;
  }

  public static getCrossPoint(coordinates1: [[number, number]], coordinates2: [[number, number]]): [number, number] {
    const x1 = coordinates1[0][0];
    const y1 = coordinates1[0][1];
    const x2 = coordinates1[1][0];
    const y2 = coordinates1[1][1];

    const x3 = coordinates2[0][0];
    const y3 = coordinates2[0][1];
    const x4 = coordinates2[1][0];
    const y4 = coordinates2[1][1];
    let x: number;
    let y: number;
    // y = Ax + B
    const A = (y1 - y2) / (x1 - x2);
    const B = (y1 - ( A * x1) );

    // y = Cx + D
    let C: number;
    if (x3 - x4 === 0) {
      x = x3;
      y = ( (y1 - y2) / (x1 - x2) ) * x + (y1 - ((y1 - y2) / (x1 - x2)) * x1 );
      return [x, y];
    } else {
      C = (y3 - y4) / (x3 - x4);
    }
    const D = (y3 - ( C * x3) );

    x = (D - B) / (A - C);
    y = ( (C * B) - (A * D) ) / (C - A);

    return [x, y];
  }

  public static checkIfPointIsBetweenPoints(pointFrom: [number, number], pointTo: [number, number], checkPoint: [number, number]): boolean {
    const distanceFromTo = this.distanceBetweenPoints(pointFrom, pointTo);
    const distanceFromCheck = this.distanceBetweenPoints(pointFrom, checkPoint);
    const distanceCheckTo = this.distanceBetweenPoints(checkPoint, pointTo);
    const distance = distanceFromTo - (distanceFromCheck + distanceCheckTo);
    return distance < 1 && distance > -1 ;
  }
}
