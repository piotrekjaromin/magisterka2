import * as L from 'leaflet';
import {latLng} from 'leaflet';
import {TileLayer} from 'leaflet';
import {tileLayer} from 'leaflet';
import {LayerGroup} from 'leaflet';
import {GeometryOperations} from '../calculationOperations/geometryOperations';
import {Marker} from 'leaflet';
import {marker} from 'leaflet';
import {icon} from 'leaflet';
import {Geojsonmodel} from '../models/geojsonmodel';
import {geoJSON} from 'leaflet';
import {DataService} from '../services/data.service';

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

  public static prepareSpeedLimitMarkersLayer(allStreetWithObjects: Geojsonmodel): LayerGroup {
    const markers: [Marker] = <[Marker]>[];

    for (const feature of allStreetWithObjects.features) {
      const coordinates = GeometryOperations.getBeginningCoordinates(feature.geometry.coordinates);
      markers.push(
        this.prepareMarker(coordinates[1], coordinates[0], feature.properties.defaultSpeedLimit)
          .on('click', (data) => console.log(data)));
    }
    return new LayerGroup(markers);
  }

  public static prepareMarker(lat: number, long: number, markerName: string) {
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

  public static parseGeoJsonToGeojsonmodel(data: Geojsonmodel) {
    return geoJSON(JSON.parse(JSON.stringify(data)));
  }

  public static createBaseLayers(data: any, allStreetWithObjects: Geojsonmodel, oneWayRoads: Geojsonmodel, twoWaysRoads: Geojsonmodel) {
    return new Map()
      .set('All objects', geoJSON(data))
      .set('Only streets', this.parseGeoJsonToGeojsonmodel(allStreetWithObjects))
      .set('One way streets', geoJSON(JSON.parse(JSON.stringify(oneWayRoads))))
      .set('Two ways streets', geoJSON(JSON.parse(JSON.stringify(twoWaysRoads))))
      .set('Speed limit', this.prepareSpeedLimitMarkersLayer(allStreetWithObjects));
  }
}
