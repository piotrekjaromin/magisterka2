import {geoJSON, icon, latLng, Layer, LayerGroup, Marker, marker, tileLayer, TileLayer} from 'leaflet';
import {DataService} from './services/data.service';
import * as L from 'leaflet';
import {SpeedService} from './services/speed.service';
import {Feature} from './models/feature';
import {CustomMarker} from './models/customMarker';
import {MapDataOperations} from './mapDataOperations';
import {DbDataService} from './services/dbData.service';

export class LayerManager {
  private allObjectLayer: Layer;
  private onlyStreetLayer: Layer;
  private mainLayer: TileLayer;
  private speedLimitMarkersLayer: Layer;
  public layersControl: any;
  public options: any;

  constructor(private dataService: DataService, private dbDataService: DbDataService, data: any) {
    this.allObjectLayer = geoJSON(data);
    const onlyStreetGeoModel = dataService.getOnlyStreet(data);
    this.onlyStreetLayer = geoJSON(JSON.parse(JSON.stringify(onlyStreetGeoModel)));
    this.mainLayer = this.prepareMainLayer();
    this.speedLimitMarkersLayer = this.prepareSpeedLimitMarkersLayer(onlyStreetGeoModel.features);
    this.options = this.prepareOptions(this.mainLayer);

    this.layersControl = {
      baseLayers: {
        'Open Street Map': this.mainLayer
      },
      overlays: {
        'All objects': this.allObjectLayer,
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

          const tmpMarker = marker([arrayOfLengths[i + 1], arrayOfLengths[i + 2]], {
            icon: icon({
              iconSize: [25, 25],
              iconAnchor: [0, 0],
              iconUrl: 'assets/' + maxSpeed + '.png'
            })});

          markers.push(tmpMarker.on('click', (data) => console.log(data)));
          feature.markers = roadMarkers;
          break;
        }
      }
      //this.dbDataService.saveRoadToDB(feature, roadMarkers);
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
