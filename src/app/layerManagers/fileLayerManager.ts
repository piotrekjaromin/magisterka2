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
        'Speed limit before pedestrian crossing': this.prepareSpeedLimitBeforePedestrianCrossingMarkersLayer(),
        'Traffic signals': this.prepareObjectMarkersLayer('traffic_signal'),
        'Streets contain traffic signals': this.parseGeoJsonToGeojsonmodel(this.getStreetsContains('traffic_signal')),
        'Rail crossing': this.prepareObjectMarkersLayer( 'rail_crossing'),
        'Streets contains rail crossing': this.parseGeoJsonToGeojsonmodel(this.getStreetsContains('rail_crossing')),
        'Pedestrian crossing': this.prepareObjectMarkersLayer('pedestrian_crossing'),
        'Streets contain pedestrian crossing': this.parseGeoJsonToGeojsonmodel(this.getStreetsContains('pedestrian_crossing')),
        'Bus stops': this.prepareBusStopLayer(),
        'Customer objects': this.prepareObjectLayer()
      }
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  private prepareSpeedLimitBeforePedestrianCrossingMarkersLayer(): LayerGroup {
    const markers: [Marker] = <[Marker]>[];
    const onlyStreetGeoModel: Geojsonmodel = this.getStreetsContains('pedestrian_crossing');
    const features = onlyStreetGeoModel.features;

    for (const feature of features) {
      for (const customMarker of feature.markers) {

        const beforeCoordinates = GeometryOperations.getCoordinatesBeforePoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 50);

        markers.push(
          this.prepareMarker(beforeCoordinates[1], beforeCoordinates[0], feature.markers[0].speed.toString())
            .on('click', (data) => console.log(1)));

        // if (Mathematical.getDistanceBetweenPointAndEndOfRoad([customMarker.lat, customMarker.long], Mathematical.revertCoordinates(feature.geometry.coordinates)) > 100) {
          const afterCoordinates = GeometryOperations.
          getCoordinatesAfterPoint([customMarker.lat, customMarker.long], feature.geometry.coordinates, 10);

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
      })});
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

  private insertObjectsToStreets(streets: Geojsonmodel, objects: Geojsonmodel, type: string) {
    const objectFeatures = objects.features;
    const streetFeatures: Geojsonmodel = streets;

    for (const objectFeature of objectFeatures) {
      for (const streetFeature of streetFeatures.features) {
        const streetContainsObject = Mathematical.pointInRectangle(streetFeature.geometry.coordinates, <any>objectFeature.geometry.coordinates);
        if (streetContainsObject) {
          const customMarker = new CustomMarker(<any>objectFeature.geometry.coordinates[0], <any>objectFeature.geometry.coordinates[1], objectFeature.properties.description, 30);

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
    this.insertObjectsToStreets(allStreets, this.dataService.getTrafficSignal(this.data), 'traffic_signal');
    this.insertObjectsToStreets(allStreets, this.dataService.getRailCrossing(this.data), 'rail_crossing');
    this.insertObjectsToStreets(allStreets, this.dataService.getPedestrialCrossing(this.data), 'pedestrian_crossing');
    this.insertDefaultSpeedLimitToStreets(allStreets);
    return allStreets;
  }

  private insertDefaultSpeedLimitToStreets(allStreets: Geojsonmodel) {
    for (const feature of allStreets.features) {
      feature.properties.defaultSpeedLimit = SpeedService.getMaxSpeed(feature).toString();
    }
  }
}
