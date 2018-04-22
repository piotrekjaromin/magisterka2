import {geoJSON, icon, LayerGroup, Marker, marker} from 'leaflet';
import {DataService} from '../services/data.service';
import {SpeedService} from '../services/speed.service';
import {Feature} from '../models/feature';
import {CustomMarker} from '../models/customMarker';
import {DbDataService} from '../services/dbData.service';
import {BaseLayerManager} from './baseLayerManager';
import {Geojsonmodel} from '../models/geojsonmodel';
import {Mathematical} from '../calculationOperations/mathematical';
import {GeometryOperations} from '../calculationOperations/geometryOperations';
import {Geometry} from '../models/geometry';

export class FileLayerManager {
  public layersControl: any;
  public options: any;
  public data: any;
  public allStreetWithObjects: Geojsonmodel;

  constructor(private dataService: DataService, private dbDataService: DbDataService, data: any) {
    this.data = data;
    this.allStreetWithObjects = this.addAllObjectsToStreets();
    this.options = BaseLayerManager.prepareOptions(BaseLayerManager.prepareMainLayer());
    this.layersControl = {
      baseLayers: {
        'Open Street Map': BaseLayerManager.prepareMainLayer()
      },
      overlays: {
        'All objects': this.prepareAllObjectsLayer(),
        'Only streets2': this.parseGeoJsonToGeojsonmodel(this.allStreetWithObjects),
        'One way streets': this.prepareOneWayStreetLayer(),
        'Speed limit': this.prepareSpeedLimitMarkersLayer(),
        'Speed limit before pedestrian crossing': this.prepareSpeedLimitBeforeBeforeAndAfterMarkersLayer('pedestrian_crossing'),
        'Traffic signals': this.prepareObjectMarkersLayer('traffic_signal'),
        'Streets contain traffic signals': this.parseGeoJsonToGeojsonmodel(this.getStreetsContains('traffic_signal')),
        'Speed limit before pedestrian traffic signals': this.prepareSpeedLimitBeforeBeforeAndAfterMarkersLayer('traffic_signal'),
        'Rail crossing': this.prepareObjectMarkersLayer('rail_crossing'),
        'Streets contains rail crossing': this.parseGeoJsonToGeojsonmodel(this.getStreetsContains('rail_crossing')),
        'Speed limit before rail crossing': this.prepareSpeedLimitBeforeBeforeAndAfterMarkersLayer('rail_crossing'),
        'Pedestrian crossing': this.prepareObjectMarkersLayer('pedestrian_crossing'),
        'Streets contain pedestrian crossing': this.parseGeoJsonToGeojsonmodel(this.getStreetsContains('pedestrian_crossing')),
        'Bus stops': this.prepareBusStopLayer(),
        'Customer objects': this.prepareObjectLayer(),
        'Schools': this.prepareSchoolsLayer(),
        'Bounding box': this.boundingBoxLayer(),
        'Bounding box all': this.getStreetContainsBoundingBox(),
         'Combined bounding box': this.parseGeoJsonToGeojsonmodel(this.getCombinedBoundingBox())
        // 'Combined bounding box': this.getCombinedBoundingBox()
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareSpeedLimitBeforeBeforeAndAfterMarkersLayer(type: string): LayerGroup {
    const markers: [Marker] = <[Marker]>[];
    const onlyStreetGeoModel: Geojsonmodel = this.getStreetsContains(type);
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      for (const customMarker of feature.markers) {

        let beforeCoordinates = GeometryOperations.getCoordinatesBeforePoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 50);

        markers.push(
          this.prepareMarker(beforeCoordinates[1], beforeCoordinates[0], feature.markers[0].speed.toString())
            .on('click', (data) => console.log(1)));

        // if (Mathematical.getDistanceBetweenPointAndEndOfRoad([customMarker.lat, customMarker.long], Mathematical.revertCoordinates(feature.geometry.coordinates)) > 100) {
        let afterCoordinates = GeometryOperations.getCoordinatesAfterPoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 10);

        markers.push(
          this.prepareMarker(afterCoordinates[1], afterCoordinates[0], feature.properties.defaultSpeedLimit)
            .on('click', (data) => console.log(2)));
        // }
      }
    }
    return new LayerGroup(markers);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareSpeedLimitMarkersLayer(): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    for (const feature of this.allStreetWithObjects.features) {
      const coordinates = GeometryOperations.getBeginningCoordinates(feature.geometry.coordinates);
      markers.push(
        this.prepareMarker(coordinates[1], coordinates[0], feature.properties.defaultSpeedLimit)
          .on('click', (data) => console.log(data)));
      // this.dbDataService.saveRoadToDB(feature);
    }

    return new LayerGroup(markers);
  }

  private prepareObjectMarkersLayer(type: string): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    for (const marker of this.getMarkers(type)) {
      markers.push(
        this.prepareMarker(marker.long, marker.lat, type)
          .on('click', (data) => console.log(type)));
    }
    return new LayerGroup(markers);
  }


  private prepareMarker(lat: number, long: number, markerName: string) {
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

  private prepareOneWayStreetLayer() {
    const onlyStreetGeoModel = this.dataService.getOneWayRoads(this.data);
    return geoJSON(JSON.parse(JSON.stringify(onlyStreetGeoModel)));
  }

  private prepareObjectLayer() {
    const objectsGeoModel = this.dataService.getObjects(this.data);
    return geoJSON(JSON.parse(JSON.stringify(objectsGeoModel)));
  }

  private prepareBusStopLayer() {
    const objectsGeoModel = this.dataService.getBusStops(this.data);
    return geoJSON(JSON.parse(JSON.stringify(objectsGeoModel)));
  }

  private prepareSchoolsLayer() {
    const objectsGeoModel = this.dataService.getSchools(this.data);
    return geoJSON(JSON.parse(JSON.stringify(objectsGeoModel)));
  }

  private prepareAllObjectsLayer() {
    return geoJSON(this.data);
  }

  private getStreetsContains(type: string) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);

    for (const feature of this.allStreetWithObjects.features) {
      if (feature.markers === undefined) {
        continue;
      }
      for (const marker2 of feature.markers) {
        if (marker2.type === type) {
          result.features.push(feature);
          break;
        }
      }
    }
    return result;
  }

  private getFeatures(description: string) {
    const result = new Geojsonmodel('FeatureCollection', <[Feature]>[]);
    for (const feature of this.allStreetWithObjects.features) {
      if (feature.properties.description === description) {
        result.features.push(feature);
      }
    }
    return result;

  }

  private getMarkers(type: string) {
    const result: [CustomMarker] = <[CustomMarker]>[];

    for (const feature of this.allStreetWithObjects.features) {
      if (feature.markers === undefined) {
        continue;
      }
      for (const marker of feature.markers) {
        if (marker.type === type) {
          result.push(marker);
        }
      }
    }
    return result;
  }

  private parseGeoJsonToGeojsonmodel(data: Geojsonmodel) {
    return geoJSON(JSON.parse(JSON.stringify(data)));
  }

  private insertObjectsToStreets(streets: Geojsonmodel, objects: Geojsonmodel, speed: string) {
    const objectFeatures = objects.features;
    const streetFeatures: Geojsonmodel = streets;

    for (const objectFeature of objectFeatures) {
      for (const streetFeature of streetFeatures.features) {
        const streetContainsObject = Mathematical.pointInRectangle(streetFeature.geometry.coordinates, <any>objectFeature.geometry.coordinates);
        if (streetContainsObject) {
          const customMarker = new CustomMarker(<any>objectFeature.geometry.coordinates[0], <any>objectFeature.geometry.coordinates[1], objectFeature.properties.description, Number(speed));

          if (streetFeature.markers === undefined) {
            const customMarkers: [CustomMarker] = <[CustomMarker]>[];
            customMarkers.push(customMarker);
            streetFeature.markers = customMarkers;
          } else {
            streetFeature.markers.push(customMarker);
          }
        }
      }
    }
    return streetFeatures;
  }

  private addAllObjectsToStreets(): Geojsonmodel {
    const allStreets: Geojsonmodel = this.dataService.getOnlyStreet(this.data);
    this.insertObjectsToStreets(allStreets, this.dataService.getTrafficSignal(this.data), '50');
    this.insertObjectsToStreets(allStreets, this.dataService.getRailCrossing(this.data), '30');
    this.insertObjectsToStreets(allStreets, this.dataService.getPedestrialCrossing(this.data), '30');
    this.insertDefaultSpeedLimitToStreets(allStreets);
    return allStreets;
  }

  private insertDefaultSpeedLimitToStreets(allStreets: Geojsonmodel) {
    for (const feature of allStreets.features) {
      feature.properties.defaultSpeedLimit = SpeedService.getMaxSpeed(feature).toString();
    }
  }

  private getBoundingBox() {
    const objectsGeoModel = this.dataService.getSchools(this.data);
    const schoolsFeatures = objectsGeoModel.features;
    const resultFeatures = <[Feature]>[];
    let counter = 0;
    for (const feature of schoolsFeatures) {
      if (feature.geometry.type !== 'Point') {
        counter++;
        const geometry = new Geometry('Polygon', <any>[GeometryOperations.getBoundingBox(feature, 30)]);
        const boundingBox = new Feature(counter.toString(), 'Feature', null, geometry, <[CustomMarker]>[]);
        resultFeatures.push(boundingBox);
      }
    }

    objectsGeoModel.features = resultFeatures;
    return objectsGeoModel;
  }

  private boundingBoxLayer() {
    return geoJSON(JSON.parse(JSON.stringify(this.getBoundingBox())));
  }

  private getStreetContainsBoundingBox() {
    const boundingBoxFeatures = this.getBoundingBox().features;
    const allStreetFeatures = this.dataService.getOnlyStreet(this.data).features;
    const coordinates: [[number, number]] = <[[number, number]]>[];

    for (const street of allStreetFeatures) {
      for (const boundingBox of boundingBoxFeatures) {
        for (const coordinate of Mathematical.getCrossPointOfRoadAndRectangle(street.geometry, boundingBox.geometry)) {
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
    this.getCombinedBoundingBox();
    return new LayerGroup(markers);
  }

  private getCombinedBoundingBox() {
    const boundingBoxModel = this.getBoundingBox();
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

          // // two
          // if (foundedInnerBoundingBox.indexOf(innerBoundingBox.id) === -1 && cornerInsideBox.length === 2) {
          //   mergedRectangles.push(this.getFeatureOfMergedTriangleOnlyWithOneSide(cornerInsideBox, innerBoundingBox, outherBoundingBox));
          // }

        }
      }
    }


    // return new LayerGroup(markers);

     let result: [Feature] = <[Feature]>[];
    for (const boundingFeature of boundingBoxModel.features) {
      if ( foundedInnerBoundingBox.indexOf(boundingFeature.id) === -1) {
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
      if ( foundedTwoCornerBoundingBox.indexOf(boundingFeature.id) === -1) {
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
      if ( foundedOneCornerBoundingBox.indexOf(boundingFeature.id) === -1) {
        result.push(boundingFeature);
      }
    }

    for (const mergedRectangle of mergedRectangles) {
      result.push(mergedRectangle);
    }

    boundingBoxModel.features = result;

    return boundingBoxModel;
  }

  private checkIfCornerIsInsideRectangle(rectangleInside: Feature, rectangle: Feature) {
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


  private getFeatureOfMergedTriangleOnlyWithOneSide(cornerInsideBox: [[number, number]], innerBoundingBox: Feature, outherBoundingBox: Feature) {
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

  private getFeatureOfMergedTriangleOnlyWithOneCorner(innerBoundingBox: Feature, outherBoundingBox: Feature) {
    let coordinates;

    let cornerInsideBox1 = this.checkIfCornerIsInsideRectangle(innerBoundingBox, outherBoundingBox);
    let cornerInsideBox2 = this.checkIfCornerIsInsideRectangle(outherBoundingBox, innerBoundingBox);
    if (cornerInsideBox1[0][1] < cornerInsideBox2[0][1] ) {
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

}
