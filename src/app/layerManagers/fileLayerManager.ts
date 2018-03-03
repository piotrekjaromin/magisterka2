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

  constructor(private dataService: DataService, private dbDataService: DbDataService, data: any) {
    const allObjectLayer = geoJSON(data);
    const onlyStreetGeoModel = dataService.getOnlyStreet(data);
    const onlyStreetLayer = geoJSON(JSON.parse(JSON.stringify(onlyStreetGeoModel)));
    const mainLayer = BaseLayerManager.prepareMainLayer();
    const speedLimitMarkersLayer = this.prepareSpeedLimitMarkersLayer(onlyStreetGeoModel.features);
    const objectsGeoModel = dataService.getObject(data);
    const objectsLayer = geoJSON(JSON.parse(JSON.stringify(objectsGeoModel)));
    this.options = BaseLayerManager.prepareOptions(mainLayer);

    this.layersControl = {
      baseLayers: {
        'Open Street Map': mainLayer
      },
      overlays: {
        'All objects': allObjectLayer,
        'Only street': onlyStreetLayer,
        'Speet limit': speedLimitMarkersLayer,
        'Objects': objectsLayer
      }
    };
  }

  private prepareSpeedLimitMarkersLayer(features: [Feature]): LayerGroup {

    const markers: [Marker] = <[Marker]>[];

    for (const feature of features) {
      const roadMarkers: [CustomMarker] = <[CustomMarker]>[];

      const arrayOfLengths = MapDataOperations.getStreetLength(feature.geometry.coordinates);
      const totalLengthOfStreet = arrayOfLengths[arrayOfLengths.length - 3];

      let currentLength = 0;
      const maxSpeed = SpeedService.getMaxSpeed(feature, totalLengthOfStreet * 111196.672);
      for (let i = 0; i < arrayOfLengths.length; i += 3) {
        currentLength += arrayOfLengths[i];

        if (currentLength >= (totalLengthOfStreet / 2)) {
          roadMarkers.push(new CustomMarker(arrayOfLengths[i + 1], arrayOfLengths[i + 2], '', maxSpeed));

          const tmpMarker = this.prepareMarker(arrayOfLengths[i + 1], arrayOfLengths[i + 2], maxSpeed.toString());

          markers.push(tmpMarker.on('click', (data) => console.log(data)));
          feature.markers = roadMarkers;
          break;
        }
      }
      // this.dbDataService.saveObjectToDB(feature, roadMarkers, DbDataService.roadHttp);
    }
    return new LayerGroup(markers);
  }

  prepareMarker(lat: number, long: number, markerName: string) {
    return marker([lat, long], {
      icon: icon({
        iconSize: [25, 25],
        iconAnchor: [0, 0],
        iconUrl: 'assets/' + markerName + '.png'
      })});
  }

}
