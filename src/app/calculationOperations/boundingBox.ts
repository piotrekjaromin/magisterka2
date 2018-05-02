import {geoJSON, icon, LayerGroup, marker, Marker} from 'leaflet';
import {GeometryOperations} from './geometryOperations';
import {Mathematical} from './mathematical';
import {CustomMarker} from '../models/customMarker';
import {Feature} from '../models/feature';
import {Geometry} from '../models/geometry';
import {Geojsonmodel} from '../models/geojsonmodel';

export class BoundingBox {

  public static getBoundingBox(objects: Geojsonmodel, distanceInMeters) {
    const objectsGeoModel = objects;
    const schoolsFeatures = objectsGeoModel.features;
    const resultFeatures = <[Feature]>[];
    let counter = 0;
    for (const feature of schoolsFeatures) {
      if (feature.geometry.type !== 'Point') {
        counter++;
        const geometry = new Geometry('Polygon', <any>[GeometryOperations.getBoundingBox(feature, distanceInMeters)]);
        const boundingBoxFeature = new Feature(counter.toString(), 'Feature', null, geometry, <[CustomMarker]>[]);
        resultFeatures.push(boundingBoxFeature);
      }
    }

    objectsGeoModel.features = resultFeatures;
    return objectsGeoModel;
  }

  public static boundingBoxLayer(objects: Geojsonmodel, distanceInMeters: number) {
    return geoJSON(JSON.parse(JSON.stringify(this.getBoundingBox(objects, distanceInMeters))));
  }

  public static getStreetContainsBoundingBox(objects: Geojsonmodel, distanceInMeters: number, streetFeatures: [Feature]) {
    const boundingBoxFeatures = this.getBoundingBox(objects, distanceInMeters).features;
    // const allStreetFeatures = this.dataService.getOnlyStreet(this.data).features;
    const allStreetFeatures = streetFeatures;
    const coordinates: [[number, number]] = <[[number, number]]>[];

    for (const street of allStreetFeatures) {
      for (const boundingBoxFeature of boundingBoxFeatures) {
        for (const coordinate of Mathematical.getCrossPointOfRoadAndRectangle(street.geometry, boundingBoxFeature.geometry)) {
          coordinates.push(coordinate);
        }
      }
    }

    const markers: [Marker] = <[Marker]>[];

    for (const coordinate of coordinates) {
      markers.push(
        this.prepareMarker(coordinate[1], coordinate[0], '10')
          .on('click', (data) => console.log(data)));
    }
    this.getCombinedBoundingBox(objects, distanceInMeters);
    return new LayerGroup(markers);
  }

  public static getCombinedBoundingBox(objects: Geojsonmodel, distanceInMeters: number) {
    const boundingBoxModel = this.getBoundingBox(objects, distanceInMeters);
    const markers: [Marker] = <[Marker]>[];

    let mergedRectangles: [Feature] = <[Feature]>[];

    const foundedInnerBoundingBox: [string] = <[string]>[];

    for (const innerBoundingBox of boundingBoxModel.features) {
      for (const outherBoundingBox of boundingBoxModel.features) {
        if (innerBoundingBox.id !== outherBoundingBox.id) {
          const cornerInsideBox = this.checkIfCornerIsInsideRectangle(innerBoundingBox, outherBoundingBox);

          // whole bounding box inside boundingBox2
          if (foundedInnerBoundingBox.indexOf(innerBoundingBox.id) === -1 && cornerInsideBox.length === 4) {
            foundedInnerBoundingBox.push(innerBoundingBox.id);
          }
        }
      }
    }

    let result: [Feature] = <[Feature]>[];
    for (const boundingFeature of boundingBoxModel.features) {
      if (foundedInnerBoundingBox.indexOf(boundingFeature.id) === -1) {
        result.push(boundingFeature);
      }
    }

    boundingBoxModel.features = result;

    const foundedTwoCornerBoundingBox: [string] = <[string]>[];
    for (const innerBoundingBox of boundingBoxModel.features) {
      for (const outherBoundingBox of boundingBoxModel.features) {
        if (innerBoundingBox.id !== outherBoundingBox.id) {
          const cornerInsideBox = this.checkIfCornerIsInsideRectangle(innerBoundingBox, outherBoundingBox);
          // two
          if (foundedInnerBoundingBox.indexOf(innerBoundingBox.id) === -1 && cornerInsideBox.length === 2) {
            foundedTwoCornerBoundingBox.push(innerBoundingBox.id);
            foundedTwoCornerBoundingBox.push(outherBoundingBox.id);
            mergedRectangles.push(this.getFeatureOfMergedTriangleOnlyWithOneSide(cornerInsideBox, innerBoundingBox, outherBoundingBox));
          }

        }
      }
    }

    result = <[Feature]>[];
    for (const boundingFeature of boundingBoxModel.features) {
      if (foundedTwoCornerBoundingBox.indexOf(boundingFeature.id) === -1) {
        result.push(boundingFeature);
      }
    }

    for (const mergedRectangle of mergedRectangles) {
      result.push(mergedRectangle);
    }

    boundingBoxModel.features = result;
    mergedRectangles = <[Feature]>[];

    const foundedOneCornerBoundingBox: [string] = <[string]>[];
    for (const innerBoundingBox of boundingBoxModel.features) {
      for (const outherBoundingBox of boundingBoxModel.features) {
        if (innerBoundingBox.id !== outherBoundingBox.id) {
          const cornerInsideBox = this.checkIfCornerIsInsideRectangle(innerBoundingBox, outherBoundingBox);
          // one
          if (
            // foundedInnerBoundingBox.indexOf(innerBoundingBox.id) === -1
          cornerInsideBox.length === 1
          && innerBoundingBox.geometry.coordinates[0].length === 5
          && outherBoundingBox.geometry.coordinates[0].length === 5
          && foundedOneCornerBoundingBox.indexOf(innerBoundingBox.id) === -1
          && foundedOneCornerBoundingBox.indexOf(outherBoundingBox.id) === -1
          ) {
            foundedOneCornerBoundingBox.push(innerBoundingBox.id);
            foundedOneCornerBoundingBox.push(outherBoundingBox.id);
            mergedRectangles.push(this.getFeatureOfMergedTriangleOnlyWithOneCorner(innerBoundingBox, outherBoundingBox));
          }

        }
      }
    }

    result = <[Feature]>[];
    for (const boundingFeature of boundingBoxModel.features) {
      if (foundedOneCornerBoundingBox.indexOf(boundingFeature.id) === -1) {
        result.push(boundingFeature);
      }
    }

    for (const mergedRectangle of mergedRectangles) {
      result.push(mergedRectangle);
    }

    boundingBoxModel.features = result;

    return boundingBoxModel;
  }

  public static checkIfCornerIsInsideRectangle(rectangleInside: Feature, rectangle: Feature) {
    const SWcorner = rectangle.geometry.coordinates[0][0];
    const NEcorner = rectangle.geometry.coordinates[0][2];

    const result: [[number, number]] = <[[number, number]]>[];

    let counter = 0;
    for (let i = 0; i < 4; i++) {
      const point = rectangleInside.geometry.coordinates[0][i];
      if (SWcorner[0] <= point[0] && NEcorner[0] >= point[0]) {
        if (SWcorner[1] <= point[1] && NEcorner[1] >= point[1]) {
          counter++;
          result.push(<any>point);
        }
      }
    }
    return result;
  }


  public static getFeatureOfMergedTriangleOnlyWithOneSide(cornerInsideBox: [[number, number]], innerBoundingBox: Feature, outherBoundingBox: Feature) {
    let coordinates;
    // coordinates = [[[0, 0], [1,1]]];

    if (cornerInsideBox[0][0] === cornerInsideBox[1][0]) {
      // left of right side of boundingBox

      if (cornerInsideBox[0][0] === innerBoundingBox.geometry.coordinates[0][0][0]) {
        // left side of the bounding box is inside outer box
        const upperCrossPoint = [outherBoundingBox.geometry.coordinates[0][1][0], cornerInsideBox[1][1]];
        const bellowCrossPoint = [outherBoundingBox.geometry.coordinates[0][1][0], cornerInsideBox[0][1]];
        coordinates = [[
          outherBoundingBox.geometry.coordinates[0][0],
          outherBoundingBox.geometry.coordinates[0][1],
          bellowCrossPoint,
          innerBoundingBox.geometry.coordinates[0][1],
          innerBoundingBox.geometry.coordinates[0][2],
          upperCrossPoint,
          outherBoundingBox.geometry.coordinates[0][2],
          outherBoundingBox.geometry.coordinates[0][3],
          outherBoundingBox.geometry.coordinates[0][0]]];
      } else {
        // right side of the bounding box is inside outer box
        const upperCrossPoint = [outherBoundingBox.geometry.coordinates[0][0][0], cornerInsideBox[1][1]];
        const bellowCrossPoint = [outherBoundingBox.geometry.coordinates[0][0][0], cornerInsideBox[0][1]];

        coordinates = [[
          outherBoundingBox.geometry.coordinates[0][0],
          outherBoundingBox.geometry.coordinates[0][1],
          outherBoundingBox.geometry.coordinates[0][2],
          outherBoundingBox.geometry.coordinates[0][3],
          upperCrossPoint,
          innerBoundingBox.geometry.coordinates[0][3],
          innerBoundingBox.geometry.coordinates[0][0],
          bellowCrossPoint,
          outherBoundingBox.geometry.coordinates[0][0]]];
      }

    } else {
      // up or down side of bounding box
      if (cornerInsideBox[0][1] === innerBoundingBox.geometry.coordinates[0][0][1]) {
        // down side of the bounding box is inside outer box
        const leftCrossPoint = [cornerInsideBox[0][0], outherBoundingBox.geometry.coordinates[0][2][1]];
        const rightCrossPoint = [cornerInsideBox[1][0], outherBoundingBox.geometry.coordinates[0][2][1]];
        // const rightCrossPoint = [innerBoundingBox.geometry.coordinates[0][1][0], innerBoundingBox.geometry.coordinates[0][1][1]];

        coordinates = [[
          outherBoundingBox.geometry.coordinates[0][0],
          outherBoundingBox.geometry.coordinates[0][1],
          outherBoundingBox.geometry.coordinates[0][2],
          rightCrossPoint,
          innerBoundingBox.geometry.coordinates[0][2],
          innerBoundingBox.geometry.coordinates[0][3],
          leftCrossPoint,
          outherBoundingBox.geometry.coordinates[0][3],
          outherBoundingBox.geometry.coordinates[0][0]]];
      } else {
        // up side of the bounding box is inside outer box
        const leftCrossPoint = [cornerInsideBox[1][0], outherBoundingBox.geometry.coordinates[0][0][1]];
        const rightCrossPoint = [cornerInsideBox[0][0], outherBoundingBox.geometry.coordinates[0][0][1]];

        coordinates = [[
          outherBoundingBox.geometry.coordinates[0][0],
          leftCrossPoint,
          innerBoundingBox.geometry.coordinates[0][0],
          innerBoundingBox.geometry.coordinates[0][1],
          rightCrossPoint,
          outherBoundingBox.geometry.coordinates[0][1],
          outherBoundingBox.geometry.coordinates[0][2],
          outherBoundingBox.geometry.coordinates[0][3],
          outherBoundingBox.geometry.coordinates[0][0]
        ]];
      }
    }
    const geometry: Geometry = new Geometry('Polygon', <any>coordinates);
    const feature: Feature = new Feature('', 'Feature', null, geometry, <[CustomMarker]>[]);
    return feature;
  }

  public static getFeatureOfMergedTriangleOnlyWithOneCorner(innerBoundingBox: Feature, outherBoundingBox: Feature) {
    let coordinates;

    let cornerInsideBox1 = this.checkIfCornerIsInsideRectangle(innerBoundingBox, outherBoundingBox);
    let cornerInsideBox2 = this.checkIfCornerIsInsideRectangle(outherBoundingBox, innerBoundingBox);
    if (cornerInsideBox1[0][1] < cornerInsideBox2[0][1]) {
      const cornerTmp = cornerInsideBox1;
      cornerInsideBox1 = cornerInsideBox2;
      cornerInsideBox2 = cornerTmp;
      const boundingBoxTmp = innerBoundingBox;
      innerBoundingBox = outherBoundingBox;
      outherBoundingBox = boundingBoxTmp;
    }
    if (cornerInsideBox1[0][0] === innerBoundingBox.geometry.coordinates[0][1][0]) {
      // outer on the left
      const leftCrossPoint = [cornerInsideBox2[0][0], cornerInsideBox1[0][1]];
      const rightCrossPoint = [cornerInsideBox1[0][0], cornerInsideBox2[0][1]];
      coordinates = [[
        innerBoundingBox.geometry.coordinates[0][0],
        innerBoundingBox.geometry.coordinates[0][1],
        rightCrossPoint,
        outherBoundingBox.geometry.coordinates[0][1],
        outherBoundingBox.geometry.coordinates[0][2],
        outherBoundingBox.geometry.coordinates[0][3],
        leftCrossPoint,
        innerBoundingBox.geometry.coordinates[0][3],
        innerBoundingBox.geometry.coordinates[0][4]
      ]];
    } else {
      // outer on the right
      const rightCrossPoint = [cornerInsideBox2[0][0], cornerInsideBox1[0][1]];
      const leftCrossPoint = [cornerInsideBox1[0][0], cornerInsideBox2[0][1]];
      coordinates = [[
        outherBoundingBox.geometry.coordinates[0][0],
        leftCrossPoint,
        innerBoundingBox.geometry.coordinates[0][0],
        innerBoundingBox.geometry.coordinates[0][1],
        innerBoundingBox.geometry.coordinates[0][2],
        rightCrossPoint,
        outherBoundingBox.geometry.coordinates[0][2],
        outherBoundingBox.geometry.coordinates[0][3],
        outherBoundingBox.geometry.coordinates[0][0]
      ]];
    }

    const geometry: Geometry = new Geometry('Polygon', <any>coordinates);
    const feature: Feature = new Feature('', 'Feature', null, geometry, <[CustomMarker]>[]);
    return feature;
  }

  public static prepareMarker(lat: number, long: number, markerName: string) {
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
}
