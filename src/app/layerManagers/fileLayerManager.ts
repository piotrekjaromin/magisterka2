import {geoJSON, icon, latLng, Layer, LayerGroup, Marker, marker, tileLayer, TileLayer} from 'leaflet';
import {DataService} from '../services/data.service';
import {SpeedService} from '../services/speed.service';
import {Feature} from '../models/feature';
import {CustomMarker} from '../models/customMarker';
import {MapDataOperations} from '../mapDataOperations';
import {DbDataService} from '../services/dbData.service';
import {BaseLayerManager} from './baseLayerManager';

export class FileLayerManager {
  public layersControl: any;
  public options: any;
  public data: any;

  constructor(private dataService: DataService, private dbDataService: DbDataService, data: any) {
    this.options = BaseLayerManager.prepareOptions(BaseLayerManager.prepareMainLayer());
    this.data = data;

    this.layersControl = {
      baseLayers: {
        'Open Street Map': BaseLayerManager.prepareMainLayer()
      },
      overlays: {
        'All objects': this.prepareAllObjectsLayer(),
        'Only street': this.prepareOnlyStreetLayer(),
        'Speet limit': this.prepareSpeedLimitMarkersLayer(),
        'traffic signals': this.prepareTrafficSignalsMarkersLayer(),
        'pedestrial crossing': this.prepareCrossingMarkersLayer(),
        'Objects2': this.prepareObjectLayer(),
        'Objects': this.getStreetContaintPedestrialCrossing()
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareSpeedLimitMarkersLayer(): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    for (const feature of this.prepareRoadsWithSpeedLimits()) {
      markers.push(
        this.prepareMarker(feature.markers[0].lat, feature.markers[0].long, feature.markers[0].speed.toString())
          .on('click', (data) => console.log(data)));

       // this.dbDataService.saveRoadToDB(feature);
    }

    return new LayerGroup(markers);
  }


  prepareRoadsWithSpeedLimits(): [Feature] {
    const onlyStreetGeoModel = this.dataService.getOnlyStreet(this.data);
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      feature.markers = <[CustomMarker]>[];
      const maxSpeed = SpeedService.getMaxSpeed(feature);
      // const centerCoordinates = this.getCenterCoordinatesOfTheRoad(feature.geometry.coordinates);
      const centerCoordinates = this.getBeginningCoordinates(feature.geometry.coordinates);

      feature.markers.push(new CustomMarker(centerCoordinates[0], centerCoordinates[1], '', maxSpeed));
    }

    return features;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareTrafficSignalsMarkersLayer(): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    for (const feature of this.prepareTrafficSignals()) {
      markers.push(
        this.prepareMarker(feature.markers[0].lat, feature.markers[0].long, 'traffic_signals')
          .on('click', (data) => console.log(feature.properties)));

    }
    console.log(markers);
    return new LayerGroup(markers);
  }

  prepareTrafficSignals(): [Feature] {
    const onlyStreetGeoModel = this.dataService.getTrafficSignal(this.data);
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      feature.markers = <[CustomMarker]>[];
      const maxSpeed = 5;
      // const centerCoordinates = this.getCenterCoordinatesOfTheRoad(feature.geometry.coordinates);
      const coordinates = feature.geometry.coordinates;

      feature.markers.push(new CustomMarker(<any>coordinates[1], <any>coordinates[0], 'traffic_signals', maxSpeed));
    }
    return features;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareCrossingMarkersLayer(): LayerGroup {

    this.getStreetContaintPedestrialCrossing();

    const markers: [Marker] = <[Marker]>[];

    for (const feature of this.prepareCrossing()) {
      markers.push(
        this.prepareMarker(feature.markers[0].lat, feature.markers[0].long, 'crossing')
          .on('click', (data) => console.log(feature.properties)));

    }
    return new LayerGroup(markers);
  }

  prepareCrossing(): [Feature] {
    const onlyStreetGeoModel = this.dataService.getPedestrialCrossing(this.data);
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      feature.markers = <[CustomMarker]>[];
      const maxSpeed = 5;
      const coordinates = feature.geometry.coordinates;
      if (coordinates.length === 2) {
        console.log('is number');
        feature.markers.push(new CustomMarker(<any>coordinates[1], <any>coordinates[0], 'crossing', maxSpeed));
      } else {
        feature.markers.push(new CustomMarker(0, 0, '', maxSpeed));
      }
    }
    return features;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareMarker(lat: number, long: number, markerName: string) {
    var iconSize;

    if (markerName === 'crossing' || markerName === 'traffic_signals') {
      iconSize = 13;
    } else {
      iconSize = 25;
    }

    return marker([lat, long], {
      icon: icon({
        iconSize: [iconSize, iconSize],
        iconAnchor: [0, 0],
        iconUrl: 'assets/' + markerName + '.png'
      })});
  }

  private getCenterCoordinatesOfTheRoad(coordinates: [[number, number]]): [number, number] {
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

  private getBeginningCoordinates(coordinates: [[number, number]]): [number, number] {
    return [coordinates[0][1], coordinates[0][0]];
  }

  private prepareOnlyStreetLayer() {
    const onlyStreetGeoModel = this.dataService.getOnlyStreet(this.data);
    return geoJSON(JSON.parse(JSON.stringify(onlyStreetGeoModel)));
  }

  private prepareObjectLayer() {
    const objectsGeoModel = this.dataService.getObjects(this.data);
    return geoJSON(JSON.parse(JSON.stringify(objectsGeoModel)));
  }

  private prepareAllObjectsLayer() {
    return geoJSON(this.data);
  }

  private getStreetContaintPedestrialCrossing() {
    var crossingFeatures = this.dataService.getPedestrialCrossing(this.data).features;
    var streetFeatures = this.dataService.getOnlyStreet(this.data);
    var filteredFeatures = <[Feature]>[];

    for (const crossingFeature of crossingFeatures) {
      for (const streetFeature of streetFeatures.features) {
        const streetContainsCrossing = this.pointInRectangle(streetFeature.geometry.coordinates, <any>crossingFeature.geometry.coordinates);
        if (streetContainsCrossing) {
          filteredFeatures.push(streetFeature);
        }
      }
    }
    streetFeatures.features = filteredFeatures;

    return geoJSON(JSON.parse(JSON.stringify(streetFeatures)));
  }

  private pointInRectangle(streetCoordinates: [[number, number]], crossingCoordinates: [number, number]) {

    var result = 10000;
    for (let i = 1; i < streetCoordinates.length; i ++) {
      const distanceFromPointToLine = this.distanceBetweenPointAndStreet(streetCoordinates[i], streetCoordinates[i - 1], crossingCoordinates);
      if (distanceFromPointToLine < result) {
        result = distanceFromPointToLine;
      }
    }

    return result === 0;

  }

  // https://stackoverflow.com/questions/910882/how-can-i-tell-if-a-point-is-nearby-a-certain-line
  private distanceBetweenPointAndStreet(point1: [number, number], point2: [number, number],  point0: [number, number]) {
    var first = ((point2[0] - point1[0]) * (point1[1] - point0[1]) )
    var second = ( (point1[0] - point0[0]) * (point2[1] - point1[1]) );
    var licznik =  Math.abs(first - second);
    licznik = licznik * 100;
    var mianownik = Math.sqrt( Math.pow((point2[0] - point1[0]), 2 ) + Math.pow((point2[1] - point1[1]), 2 ));
    var distance = licznik / mianownik;


    return distance;
  }
}
