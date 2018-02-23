import {geoJSON, icon, latLng, Layer, LayerGroup, Marker, marker, tileLayer, TileLayer} from 'leaflet';
import {DataService} from './services/data.service';
import * as L from 'leaflet';
import {GeojsonFromDbModel} from './models/geojsonFromDbModel';
import {FeatureFromDB} from './models/featureFromDB';

export class DbLayerManager {
  private onlyStreetLayer: Layer;
  private mainLayer: TileLayer;
  private speedLimitMarkersLayer: Layer;
  public layersControl: any;
  public options: any;

  constructor(private dataService: DataService, data: any) {
    const geojsonFromDbModel = new GeojsonFromDbModel('FeatureCollection', data);
    this.onlyStreetLayer = geoJSON(JSON.parse(JSON.stringify(geojsonFromDbModel)));
    this.mainLayer = this.prepareMainLayer();
    this.speedLimitMarkersLayer = this.prepareSpeedLimitMarkersLayer(geojsonFromDbModel.features);
    this.options = this.prepareOptions(this.mainLayer);

    this.layersControl = {
      baseLayers: {
        'Open Street Map': this.mainLayer
      },
      overlays: {
        'Only street': this.onlyStreetLayer,
        'Markers': this.speedLimitMarkersLayer
      }
    };
  }

  drawOnMapOptions = {
    position: 'topright',
    draw: {
      marker: {
        icon: L.icon({
          iconSize: [25, 41],
          iconAnchor: [13, 41],
          iconUrl: 'assets/marker-icon.png',
          shadowUrl: 'assets/marker-shadow.png'
        })
      },
      polyline: false,
      circle: {
        shapeOptions: {
          color: '#aaaaaa'
        }
      }
    }
  };

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

  prepareMainLayer() {
    return tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      detectRetina: true
    });
  }

  prepareOptions(layer: TileLayer) {
    return {
      layers: [
        layer]
      ,
      zoom: 15,
      center: latLng([50.034279, 19.894034]),
      legend: {
        position: 'bottomleft',
        colors: ['#ff0000', '#28c9ff', '#0000ff', '#ecf386'],
        labels: ['National Cycle Route', 'Regional Cycle Route', 'Local Cycle Network', 'Cycleway']
      },
    };
  }

}
