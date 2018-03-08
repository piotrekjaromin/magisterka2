import {geoJSON, icon, LayerGroup, Marker, marker} from 'leaflet';
import {DataService} from '../services/data.service';
import {GeojsonFromDbModel} from '../models/geojsonFromDbModel';
import {BaseLayerManager} from './baseLayerManager';
import {CustomMarker} from '../models/customMarker';

export class DbLayerManager {
  public layersControl: any;
  public options: any;

  constructor(private dataService: DataService, roadsData: any, objectData: any, customMarkers: any) {
    this.options = BaseLayerManager.prepareOptions(BaseLayerManager.prepareMainLayer());

    this.layersControl = {
      baseLayers: {
        'Open Street Map': BaseLayerManager.prepareMainLayer()
      },
      overlays: {
        'Only street': this.prepareOnlyStreetLayer(roadsData),
        'Speed limit': this.prepareSpeedLimitMarkersLayer(roadsData),
        'Objects': this.prepareObjectLayer(objectData),
        'Custom objects': this.prepareCustomMarkersLayer(customMarkers)
      }
    };
  }

  private prepareSpeedLimitMarkersLayer(roadsData: any): LayerGroup {
    const streetsGeojsonFromDbModel = new GeojsonFromDbModel('FeatureCollection', roadsData);
    const markers: [Marker] = <[Marker]>[];

    for (const feature of streetsGeojsonFromDbModel.features) {
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

  private prepareOnlyStreetLayer(roadsData: any) {
    const streetsGeojsonFromDbModel = new GeojsonFromDbModel('FeatureCollection', roadsData);
    return geoJSON(JSON.parse(JSON.stringify(streetsGeojsonFromDbModel)));
  }

  private prepareObjectLayer(objectData: any) {
    const objectGeojsonFromDbModel = new GeojsonFromDbModel('FeatureCollection', objectData);
    return geoJSON(JSON.parse(JSON.stringify(objectGeojsonFromDbModel)));
  }

  private prepareCustomMarkersLayer(customMarkers: [CustomMarker]) {
    const markers: [Marker] = <[Marker]>[];

    for (const customMarker of customMarkers) {
      const tmpMarker = marker([customMarker.lat, customMarker.long], {
        icon: icon({
          iconSize: [25, 25],
          iconAnchor: [0, 0],
          iconUrl: 'assets/' + 130 + '.png'
        })});
      markers.push(tmpMarker.on('click', (data) => console.log(data)));
    }

    return new LayerGroup(markers);
  }

}
