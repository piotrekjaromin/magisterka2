export class MapDataOperations {

  public static getStreetLength(coordinates: [[number, number]]): [number, number, number] {
    const arrayOfLength: [number, number, number] = <[number, number, number]>[];
    let totalLength = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      let x0 = coordinates[i][0];
      let x1 = coordinates[i + 1][0];

      if (x0 > x1) {
        const tmp = x0;
        x0 = x1;
        x1 = tmp;
      }

      let y0 = coordinates[i][1];
      let y1 = coordinates[i + 1][1];

      if (y0 > y1) {
        const tmp = y0;
        y0 = y1;
        y1 = tmp;
      }

      const xLenght = x1 - x0;
      const yLength = y1 - y0;

      const length = Math.sqrt(Math.pow(xLenght, 2) + Math.pow(yLength, 2)); // length between two nearest coordinates
      const latCoordinate = y1 - (yLength / 2); // center latitude coordinate between two nearest coordinates
      const longCoordinate = x1 - (xLenght / 2); // center longitude coordinate between two nearest coordinates
      arrayOfLength.push(length, latCoordinate, longCoordinate);
      totalLength += length;
    }
    arrayOfLength.push(totalLength, 0, 0);
    return arrayOfLength;
  }

  private static calculateStreetLength(xLength: number, yLength: number) {
    return Math.sqrt(Math.pow(xLength, 2) + Math.pow(yLength, 2));
  }


}
