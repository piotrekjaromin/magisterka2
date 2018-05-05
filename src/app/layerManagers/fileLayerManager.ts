import {DataService} from '../services/data.service';
import {DbDataService} from '../services/dbData.service';
import {BaseLayerManager} from './baseLayerManager';
import {Geojsonmodel} from '../models/geojsonmodel';
import {TwoDimensions} from '../mapObjects/twoDimensions';
import {OneDimension} from '../mapObjects/oneDimension';
import {OtherObjects} from '../mapObjects/otherObjects';

export class FileLayerManager {
  public layersControl: any;
  public options: any;
  public data: any;
  public allStreetWithObjects: Geojsonmodel;
  public all2dObjects: Geojsonmodel;

  constructor(private dataService: DataService, private dbDataService: DbDataService, data: any) {

    this.data = data;
    this.allStreetWithObjects = OneDimension.addAllObjectsToStreets(dataService, data);
    this.all2dObjects = TwoDimensions.prepare2dObjects(dataService, data);

    TwoDimensions.add2dObjectToStreet('bus_stop', 30, this.allStreetWithObjects, 5, this.all2dObjects);
    TwoDimensions.add2dObjectToStreet('school', 30,  this.allStreetWithObjects, 30, this.all2dObjects);
    TwoDimensions.add2dObjectToStreet('shops_churches', 40,  this.allStreetWithObjects, 30, this.all2dObjects);

    this.options = BaseLayerManager.prepareOptions(BaseLayerManager.prepareMainLayer());

    const baseLayersMap = new Map().set('Open Street Map',  BaseLayerManager.prepareMainLayer());

    const overlaysMapBase = BaseLayerManager.createBaseLayers(
      this.data, this.allStreetWithObjects,
      this.dataService.getOneWayRoads(this.data),
      this.dataService.getTwoWaysRoads(this.data));
    const overlaysMapOneDimension =  OneDimension.createLayers(['pedestrian_crossing', 'rail_crossing', 'traffic_signal'], this.allStreetWithObjects);
    const overlaysMapTwoDimensions = TwoDimensions. createLayers([['bus_stop', 5], ['school', 30], ['shops_churches', 30]], this.all2dObjects, this.allStreetWithObjects);
    const overlaysMapTwoDimensionsPoint = TwoDimensions.createLayersOnlyPoints(['bus_stop', 'school', 'shops_churches'], this.allStreetWithObjects);
    const overlaysMapOther = OtherObjects.prepareOtherLayers(this.allStreetWithObjects);

    this.layersControl = {
      baseLayers: baseLayersMap,
      overlays: new Map([...overlaysMapBase,
        ...overlaysMapOneDimension,
        ...overlaysMapTwoDimensions,
        ...overlaysMapOther,
        ...overlaysMapTwoDimensionsPoint])};
  }

}
