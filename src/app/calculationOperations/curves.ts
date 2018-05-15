import {Feature} from '../models/feature';
import {Geometry} from '../models/geometry';
import {CustomMarker} from '../models/customMarker';
import {Geojsonmodel} from '../models/geojsonmodel';
import {Mathematical} from './mathematical';
import {DataService} from '../services/data.service';
import {GeometryOperations} from './geometryOperations';

export class Curves {

  public static addCurvesToStreet(curves: [Feature], streets: Geojsonmodel) {
    for (const street of streets.features) {
      for (const curve of curves) {
        const customMarker: [CustomMarker] = <[CustomMarker]>[];
        if (Mathematical.pointInRectangle(street.geometry.coordinates, curve.geometry.coordinates[0])) {
          console.log('curve start');
          customMarker.push(new CustomMarker(<any>curve.geometry.coordinates[0][0], <any>curve.geometry.coordinates[0][1], 'curve_start', Number(0)));
        }
        if (Mathematical.pointInRectangle(street.geometry.coordinates, curve.geometry.coordinates[curve.geometry.coordinates.length - 1])) {
          console.log('curve end')
          customMarker.push(new CustomMarker(<any>curve.geometry.coordinates[curve.geometry.coordinates.length - 1][0], <any>curve.geometry.coordinates[curve.geometry.coordinates.length - 1][1], 'curve_end', Number(0)));
        }
        if (customMarker.length > 0) {
          if (street.markers === undefined) {
            street.markers = customMarker;
          } else {
            for (const marker of customMarker) {
              street.markers.push(marker);
            }
          }
        }
      }
    }
  }

  public static getCurvesGeojson(features: [Feature]) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);
    const featuresResult: [Feature] = <[Feature]>[];
    for (const feature of features) {
      for (const curveFeature of this.getCurves(feature.geometry.coordinates, true)) {
        featuresResult.push(curveFeature);
      }
      for (const curveFeature of this.getCurves(feature.geometry.coordinates, false)) {
        featuresResult.push(curveFeature);
      }
    }
    result.features = featuresResult;
    return result;
  }

  private static getCurves(coordinates: [[number, number]], isLeft: boolean) {
    const result: [Feature] = <[Feature]>[];
    let counter = 0;
    let resultTmp: [[number, number]] = <[[number, number]]>[];
    for (let i = 0; i <= coordinates.length - 3; i++) {
      const xa = coordinates[i][0];
      const ya = coordinates[i][1];
      const xb = coordinates[i + 1][0];
      const yb = coordinates[i + 1][1];
      const xc = coordinates[i + 2][0];
      const yc = coordinates[i + 2][1];
      const equation = ((xb - xa) * (yc - ya)) - ((yb - ya) * (xc - xa));
      let condition;
      if (isLeft) {
        condition = equation > 0;
      } else {
        condition = equation < 0;
      }
      if (condition) {
        if (counter === 0) {
          resultTmp.push(coordinates[i]);
          resultTmp.push(coordinates[i + 1]);
          resultTmp.push(coordinates[i + 2]);
        } else {
          resultTmp.push(coordinates[i + 2]);
        }
        counter = counter + 1;
      } else {
        if (resultTmp.length > 0) {
          if (this.getRadius(resultTmp) > 50) {
            const geometry = new Geometry('LineString', resultTmp);
            const feature = new Feature('1', 'Feature', null, geometry, <[CustomMarker]>[]);
            result.push(feature);
          }
          counter = 0;
          resultTmp = <[[number, number]]>[];
        }
      }
    }
    return this.trimCurves(result);
  }

  private static trimCurves(features: [Feature]) {
    for (let i = 0; i < features.length; i++) {
      const length = features[i].geometry.coordinates.length;
      if (Mathematical.distanceBetweenPoints(features[i].geometry.coordinates[0], features[i].geometry.coordinates[1]) > 30) {
        features[i].geometry.coordinates[0] = GeometryOperations.getCoordinatesBeforePoint(features[i].geometry.coordinates[1], features[i].geometry.coordinates, 30);
      }
      if (Mathematical.distanceBetweenPoints(features[i].geometry.coordinates[length - 2], features[i].geometry.coordinates[length - 1]) > 30) {
        features[i].geometry.coordinates[length - 1] = GeometryOperations.getCoordinatesAfterPoint(features[i].geometry.coordinates[length - 2], features[i].geometry.coordinates, 30);
      }
    }
    return features;
  }

  private static getRadius(coordinates: [[number, number]]) {
    let result = 0;
    const startPoint = coordinates[0];
    const endPoint = coordinates[coordinates.length - 1];
    let distance;
    for (const coordinate of coordinates) {
      distance = Mathematical.distanceBetweenPointAndStreet(startPoint, endPoint, coordinate);
      if (distance > result) {
        result = distance;
      }
    }
    return DataService.coordinatesToMeters(result);
  }
}
