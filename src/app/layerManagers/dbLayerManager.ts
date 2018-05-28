import {DataService} from '../services/data.service';
import {DbDataService} from '../services/dbData.service';
import {BaseLayerManager} from './baseLayerManager';
import {Geojsonmodel} from '../models/geojsonmodel';
import {TwoDimensions} from '../mapObjects/twoDimensions';
import {OneDimension} from '../mapObjects/oneDimension';
import {OtherObjects} from '../mapObjects/otherObjects';
import {Curves} from '../calculationOperations/curves';
import {Feature} from '../models/feature';

export class DbLayerManager {
  public layersControl: any;
  public options: any;
  public allStreetWithObjects: Geojsonmodel;

  constructor(private streets: [Feature], private objects: [Feature]) {

    this.allStreetWithObjects = OneDimension.addAllObjectsToStreets(streets, objects);
    const overlaysMapOneDimension =  OneDimension.createLayers(['pedestrian_crossing', 'rail_crossing', 'traffic_signal'], this.allStreetWithObjects);
    TwoDimensions.add2dObjectToStreet('bus_stop', 30, this.allStreetWithObjects.features, 5, this.objects);
    TwoDimensions.add2dObjectToStreet('school', 30,  this.allStreetWithObjects.features, 30, this.objects);
    TwoDimensions.add2dObjectToStreet('shops_churches', 40,  this.allStreetWithObjects.features, 30, this.objects);
    const curveGeojson = Curves.getCurvesGeojson(this.allStreetWithObjects.features);
    Curves.addCurvesToStreet(curveGeojson, this.allStreetWithObjects);
    const curveLayers = Curves.getCurvesLayers(curveGeojson, this.allStreetWithObjects);
    const finishedSpeed = OtherObjects.finishedSpeedLayer(this.allStreetWithObjects, this.objects);


    this.options = BaseLayerManager.prepareOptions(BaseLayerManager.prepareMainLayer());
    const baseLayersMap = new Map().set('Open Street Map',  BaseLayerManager.prepareMainLayer());

    const overlaysMapBase = BaseLayerManager.createBaseLayers(this.allStreetWithObjects.features);
    const overlaysMapTwoDimensions = TwoDimensions. createLayers([['bus_stop', 5], ['school', 30], ['shops_churches', 30]], this.allStreetWithObjects.features, this.objects);
    const overlaysMapTwoDimensionsPoint = TwoDimensions.createLayersOnlyPoints(['bus_stop', 'school', 'shops_churches'], this.allStreetWithObjects);
    const overlaysMapOther = OtherObjects.prepareOtherLayers(this.allStreetWithObjects);


    this.layersControl = {
      baseLayers: baseLayersMap,
      overlays: new Map([
        ...overlaysMapBase,
        ...overlaysMapOneDimension,
        ...overlaysMapTwoDimensions,
        ...overlaysMapOther,
        ...overlaysMapTwoDimensionsPoint,
        ...curveLayers,
        ...finishedSpeed
      ])};
  }

}
