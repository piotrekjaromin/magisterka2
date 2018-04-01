import {geoJSON, icon, latLng, Layer, LayerGroup, Marker, marker, tileLayer, TileLayer} from 'leaflet';
import {DataService} from '../services/data.service';
import {SpeedService} from '../services/speed.service';
import {Feature} from '../models/feature';
import {CustomMarker} from '../models/customMarker';
import {MapDataOperations} from '../mapDataOperations';
import {DbDataService} from '../services/dbData.service';
import {BaseLayerManager} from './baseLayerManager';
import {Geojsonmodel} from '../models/geojsonmodel';
import {StreetAndPoint} from '../mathematicalOperations/streetAndPoint';

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
        'Only streets': this.prepareOnlyStreetLayer(),
        'One way streets': this.prepareOneWayStreetLayer(),
        'Speed limit': this.prepareSpeedLimitMarkersLayer(),
        'Speed limit before pedestrian crossing': this.prepareSpeedLimitBeforePedestrianCrossingMarkersLayer(),
        'Traffic signals': this.prepareTrafficSignalsMarkersLayer(),
        'Streets contain traffic signals': this.getStreetsContainTrafficSignal(),
        'Rail crossing': this.prepareRailCrossingMarkersLayer(),
        'Streets contains rail crossing': this.getStreetsContainRailCrossing(),
        'Pedestrian crossing': this.preparePedestrianCrossingMarkersLayer(),
        'Streets contain pedestrian crossing': this.getStreetsContainPedestrianCrossing(),
        'Bus stops': this.prepareBusStopLayer(),
        'Customer objects': this.prepareObjectLayer()
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareSpeedLimitBeforePedestrianCrossingMarkersLayer(): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    const onlyStreetGeoModel: Geojsonmodel = this.insertObjectsToStreets(this.dataService.getPedestrialCrossing(this.data), 'pedestrian crossing')
    const features = onlyStreetGeoModel.features;

   for (const feature of features) {
     for (const customMarker of feature.markers) {
       const centerCoordinates = this.getCoordinatesBeforePoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 50);
       if (centerCoordinates[0] > centerCoordinates[1]) {
          const tmp = centerCoordinates[0];
          centerCoordinates[0] = centerCoordinates[1];
          centerCoordinates[1] = tmp;
       }
       markers.push(
         this.prepareMarker(centerCoordinates[1], centerCoordinates[0], feature.markers[0].speed.toString())
           .on('click', (data) => console.log(data)));

     }
   }
    return new LayerGroup(markers);
  }


  prepareRoadsWithSpeedLimitsBeforePedestrianCrossing(): [Feature] {
   const onlyStreetGeoModel: Geojsonmodel = this.insertObjectsToStreets(this.dataService.getPedestrialCrossing(this.data), 'pedestrian crossing')
   const features = onlyStreetGeoModel.features;

   for (const feature of features) {
     feature.markers = <[CustomMarker]>[];
     const maxSpeed = 30;
      // const centerCoordinates = this.getCenterCoordinatesOfTheRoad(feature.geometry.coordinates);
      const centerCoordinates = this.getCoordinatesBeforePoint([feature.markers[0].lat, feature.markers[0].lat], feature.geometry.coordinates, 50);


      feature.markers.push(new CustomMarker(centerCoordinates[0], centerCoordinates[1], '', maxSpeed));
    }
    return features;
    // return <[Feature]>[];
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
    return this.prepareObjectMarkersLayer(this.dataService.getTrafficSignal(this.data), 'traffic_signals');
  }

  private prepareRailCrossingMarkersLayer(): LayerGroup {
    return this.prepareObjectMarkersLayer(this.dataService.getRailCrossing(this.data), 'rail_crossing');
  }

  private preparePedestrianCrossingMarkersLayer(): LayerGroup {
    return this.prepareObjectMarkersLayer(this.dataService.getPedestrialCrossing(this.data), 'crossing');
  }

  private prepareObjectMarkersLayer(object: Geojsonmodel, description: string): LayerGroup {
    const coordinatesOfMarkers = this.getCoordinatesOfMarkers(object);
    const markers: [Marker] = <[Marker]>[];

    for (const feature of coordinatesOfMarkers) {
      markers.push(
        this.prepareMarker(feature.markers[0].lat, feature.markers[0].long, description)
          .on('click', (data) => console.log(feature.properties)));
    }
    return new LayerGroup(markers);
  }

  getCoordinatesOfMarkers(objects: Geojsonmodel): [Feature] {
    const features = objects.features;

    for (const feature of features) {
      feature.markers = <[CustomMarker]>[];
      const maxSpeed = 5;
      const coordinates = feature.geometry.coordinates;
      if (coordinates.length === 2) {
        feature.markers.push(new CustomMarker(<any>coordinates[1], <any>coordinates[0], '', maxSpeed));
      }
    }
    return features;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareMarker(lat: number, long: number, markerName: string) {
    let iconSize;

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

  private prepareAllObjectsLayer() {
    return geoJSON(this.data);
  }

  private getStreetsContainPedestrianCrossing() {
    return this.getStreetContainsPointObject(this.dataService.getPedestrialCrossing(this.data), 'pedestrian crossing');
  }

  private getStreetsContainRailCrossing() {
    return this.getStreetContainsPointObject(this.dataService.getRailCrossing(this.data), 'rail crossing');
  }

  private getStreetsContainTrafficSignal() {
    return this.getStreetContainsPointObject(this.dataService.getTrafficSignal(this.data), 'traffic signal');
  }

  private getCoordinatesBeforePoint(point: [number, number], streetCoordinates: [[number, number]], distanceBefore: number): [number, number] {
    for (let i = 0; i < streetCoordinates.length - 1; i++) {
      if ( this.isBetweenPoint(streetCoordinates[i][0], streetCoordinates[i + 1][0], point[0])
        && this.isBetweenPoint(streetCoordinates[i][1], streetCoordinates[i + 1][1], point[1])) {

        let distanceBetweenPoints = StreetAndPoint.distanceBetweenPoints([streetCoordinates[i][0], streetCoordinates[i][1]], point);

        while (true) {
          if (distanceBetweenPoints >= distanceBefore) {
            const x1 = streetCoordinates[i][0];
            const y1 = streetCoordinates[i][1];
            const x2 = streetCoordinates[i + 1][0];
            const y2 = streetCoordinates[i + 1][1];

            const distance = StreetAndPoint.distanceBetweenPoints([x1, y1], [x2, y2]);

            const x0 = x2 - ( (distanceBefore * (x2 - x1)) / distance);
            const y0 = y2 - ( (distanceBefore * (y2 - y1)) / distance);
            console.log(x0 + ': ' + y0);
            return [x0, y0];
          } else {
            distanceBefore = distanceBefore - distanceBetweenPoints;
            if (i === 0) {
              return this.getBeginningCoordinates(streetCoordinates);
            } else {
              distanceBetweenPoints = StreetAndPoint.distanceBetweenPoints(
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

  private isBetweenPoint(from: number, to: number, toCheck: number): boolean {
    if (from <= toCheck && to >= toCheck) {
      return true;
    } else if (to <= toCheck && from >= toCheck) {
      return true;
    }
    return false;
  }

  private getStreetContainsPointObject(objects: Geojsonmodel, type: string) {
    return geoJSON(JSON.parse(JSON.stringify(this.insertObjectsToStreets(objects, type))));
  }

  private insertObjectsToStreets(objects: Geojsonmodel, type: string): Geojsonmodel {
    const objectFeatures = objects.features;
    const streetFeatures = this.dataService.getOnlyStreet(this.data);
    const filteredFeatures = <[Feature]>[];

    for (const objectFeature of objectFeatures) {
      for (const streetFeature of streetFeatures.features) {
        const streetContainsObject = StreetAndPoint.pointInRectangle(streetFeature.geometry.coordinates, <any>objectFeature.geometry.coordinates);
        if (streetContainsObject) {
          const customMarker = new CustomMarker(<any>objectFeature.geometry.coordinates[0], <any>objectFeature.geometry.coordinates[1], type, 30);

          if (streetFeature.markers === undefined) {
            const customMarkers: [CustomMarker] = <[CustomMarker]>[];
            customMarkers.push(customMarker);
            streetFeature.markers = customMarkers;
          } else {
            streetFeature.markers.push(customMarker);
          }
          filteredFeatures.push(streetFeature);
        }
      }
    }
    streetFeatures.features = filteredFeatures;

    return streetFeatures;
  }


}
