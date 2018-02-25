import * as L from 'leaflet';
import {latLng} from 'leaflet';
import {TileLayer} from 'leaflet';
import {tileLayer} from 'leaflet';

export class BaseLayerManager {

  static drawOnMapOptions = {
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

  static prepareMainLayer() {
    return tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      detectRetina: true
    });
  }

  static prepareOptions(layer: TileLayer) {
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
