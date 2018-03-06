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
        'Objects': this.prepareObjectLayer()
      }
    };
  }

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
      const centerCoordinates = this.getCenterCoordinatesOfTheRoad(feature.geometry.coordinates);

      feature.markers.push(new CustomMarker(centerCoordinates[0], centerCoordinates[1], '', maxSpeed));
    }

    return features;
  }

  private prepareMarker(lat: number, long: number, markerName: string) {
    return marker([lat, long], {
      icon: icon({
        iconSize: [25, 25],
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
}
