import {geoJSON, icon, LayerGroup, Marker, marker} from 'leaflet';
import {DataService} from '../services/data.service';
import {GeojsonFromDbModel} from '../models/geojsonFromDbModel';
import {FeatureFromDB} from '../models/featureFromDB';
import {BaseLayerManager} from './baseLayerManager';

export class DbLayerManager {
  public layersControl: any;
  public options: any;

  constructor(private dataService: DataService, roadsData: any, objectData: any) {
    const streetsGeojsonFromDbModel = new GeojsonFromDbModel('FeatureCollection', roadsData);
    const onlyStreetLayer = geoJSON(JSON.parse(JSON.stringify(streetsGeojsonFromDbModel)));
    const mainLayer = BaseLayerManager.prepareMainLayer();
    const speedLimitMarkersLayer = this.prepareSpeedLimitMarkersLayer(streetsGeojsonFromDbModel.features);
    this.options = BaseLayerManager.prepareOptions(mainLayer);
    const objectGeojsonFromDbModel = new GeojsonFromDbModel('FeatureCollection', objectData);
    const objectsLayer = geoJSON(JSON.parse(JSON.stringify(objectGeojsonFromDbModel)));

    this.layersControl = {
      baseLayers: {
        'Open Street Map': mainLayer
      },
      overlays: {
        'Only street': onlyStreetLayer,
        'Speed limit': speedLimitMarkersLayer,
        'Objects': objectsLayer
      }
    };
  }

  private prepareSpeedLimitMarkersLayer(features: [FeatureFromDB]): LayerGroup {

    const markers: [Marker] = <[Marker]>[];

    for (const feature of features) {
      for (const markerFromDb of feature.markers) {
        const tmpMarker = marker([markerFromDb.lat, markerFromDb.long], {
          icon: icon({
            iconSize: [25, 25],
            iconAnchor: [0, 0],
            iconUrl: 'assets/' + markerFromDb.speed + '.png'
          })});
        markers.push(tmpMarker.on('click', (data) => console.log(data)));
      }
    }
    return new LayerGroup(markers);
  }

}
