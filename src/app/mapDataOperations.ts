export class MapDataOperations {

  public static getStreetLength(coordinates: [[number, number]]): [number, number, number] {
    const arrayOfLength: [number, number, number] = <[number, number, number]>[];
    let totalLength = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {

      let x0 = coordinates[i][0];
      let x1 = coordinates[i + 1][0];

      let y0 = coordinates[i][1];
      let y1 = coordinates[i + 1][1];

      const xLength = Math.abs(x1 - x0);
      const yLength = Math.abs(y1 - y0);

      const length = this.calculateStreetLength(xLength, yLength); // length between two nearest coordinates
      const latCoordinate = y1 - (yLength / 2); // center latitude coordinate between two nearest coordinates
      const longCoordinate = x1 - (xLength / 2); // center longitude coordinate between two nearest coordinates
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
