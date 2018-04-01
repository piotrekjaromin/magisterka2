import {DataService} from '../services/data.service';

export class StreetAndPoint {

  // traktujemy ulice jako prostokąt, poprzed
  public static pointInRectangle(streetCoordinates: [[number, number]], crossingCoordinates: [number, number]) {

    let result = 10000;
    for (let i = 1; i < streetCoordinates.length; i ++) {
      const distanceFromPointToLine =
        StreetAndPoint.distanceBetweenPointAndStreet(streetCoordinates[i], streetCoordinates[i - 1], crossingCoordinates);
      if (distanceFromPointToLine < result) {
        result = distanceFromPointToLine;
      }
    }
    return result === 0;
  }

  // https://stackoverflow.com/questions/910882/how-can-i-tell-if-a-point-is-nearby-a-certain-line
  public static distanceBetweenPointAndStreet(point1: [number, number], point2: [number, number],  point0: [number, number]) {
    const first = ((point2[0] - point1[0]) * (point1[1] - point0[1]) )
    const second = ( (point1[0] - point0[0]) * (point2[1] - point1[1]) );
    let licznik =  Math.abs(first - second);
    licznik = licznik * 100;
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
}
