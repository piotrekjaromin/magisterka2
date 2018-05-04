import {Injectable} from '@angular/core';


import { HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Geojsonmodel} from '../models/geojsonmodel';
import {Feature} from '../models/feature';
import {DbDataService} from './dbData.service';

@Injectable()
export class DataService {

  public static coordinatesToMeters(distanceInDegree: number): number {
    return distanceInDegree * 111196.672;
  }

  public static metersToCoordinates(distanceInMeters: number): number {
    return distanceInMeters / 111196.672;
  }

  constructor(private http: HttpClient, private dbDataService: DbDataService) {}

  getJson() {
    return this.http.get('../assets/map_medium.geojson');
  }

  getOnlyStreet(geoModel: Geojsonmodel): Geojsonmodel {
    var counter = 0;
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    for (const feature of features) {
      if (
        feature.geometry.type === 'LineString'
        && feature.properties.route !== 'bicycle'
        && feature.properties.route !== 'hiking'
        && feature.properties.route !== 'bus'
        && feature.properties.highway !== 'path'
        && feature.properties.highway !== 'cycleway'
        && feature.properties.highway !== 'footway'
        && feature.properties.highway !== 'track'
        && feature.properties.highway !== 'steps'
        && feature.properties.highway !== 'proposed'

        && feature.properties.natural === undefined
        && feature.properties.barrier === undefined
        && feature.properties.waterway === undefined
        // && feature.properties.highway !== 'residential' // to remove
        // && feature.properties.surface !== 'asphalt' // to remove
        // && feature.properties.highway !== 'tertiary' // to remove
        // && feature.properties.highway !== 'living_street' // to remove
        // && feature.properties.bicycle === undefined // to remove
        // && feature.properties.highway === undefined // to remove
        // && feature.properties.highway !== 'service' // to remove
        // && feature.properties.highway !== 'primary' // to remove
        // && feature.properties.highway !== 'secondary' // to remove
        // && feature.properties.highway !== 'construction' // to remove
        && feature.properties.location !== 'overhead'
        && feature.properties.location !== 'underground'
        && feature.properties.traffic_calming !== 'island'
        && feature.properties.railway === undefined
        && feature.properties.man_made === undefined
        && feature.properties.network === undefined
        && feature.properties.highway !== 'pedestrian'
        && feature.properties.boundary === undefined
        && feature.properties.construction !== 'footway'
        && feature.properties.landcover !== 'grass'
        && feature.properties.service !== 'parking_aisle'
        && feature.properties.type !== 'parking_fee'
        && feature.properties.power === undefined
        && feature.properties.playground === undefined
        && feature.properties.description === undefined
      ) {
        // console.log(feature.properties);
        filteredFeatures.push(feature);
       //
       //  if (counter === 7) {
       //    filteredFeatures.push(feature);
       //    console.log(feature);
       //  }
       //  counter++;
      }
    }
    result.features = filteredFeatures;
    return result;
  }

  getOneWayRoads(geoModel: Geojsonmodel): Geojsonmodel {
    const allRoads = this.getOnlyStreet(geoModel);
    const filteredFeatures: [Feature] = <[Feature]>[];
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));

    for (const feature of allRoads.features) {
      if (feature.properties.oneway === 'yes') {
        feature.properties.description = 'one_way';
        filteredFeatures.push(feature);
      }
    }

    result.features = filteredFeatures;
    return result;
  }

  getTwoWaysRoads(geoModel: Geojsonmodel): Geojsonmodel {
    const allRoads = this.getOnlyStreet(geoModel);
    const filteredFeatures: [Feature] = <[Feature]>[];
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));

    for (const feature of allRoads.features) {
      if (feature.properties.oneway !== 'yes') {
        feature.properties.description = 'two_ways';
        filteredFeatures.push(feature);
      }
    }

    result.features = filteredFeatures;
    return result;
  }

  getShopsAndChurches(geoModel: Geojsonmodel): Geojsonmodel {
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];

    for (const feature of features) {
      if (feature.properties.building === 'supermarket'
        || feature.properties.building === 'chapel'
        || feature.properties.building === 'church') {
        feature.properties.description = 'shops_churches';
        filteredFeatures.push(feature);
      }
    }
    result.features = filteredFeatures;
    return result;
  }

  getBuildings(geoModel: Geojsonmodel): Geojsonmodel {
    var counter = 0;
    const features: [Feature] = geoModel.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    for (const feature of features) {
      if (
        feature.geometry.type !== 'LineString'
        && feature.properties.highway !== 'bus_stop'  // change to equals
        && feature.properties.bus !== 'yes'  // change to equals
        && feature.properties.type !== 'route'
        && feature.geometry.type === 'Polygon'
        && feature.properties.leisure !== 'park'  // change to equals
        && feature.properties.amenity !== 'university'  // change to equals
        && feature.properties.amenity !== 'school'  // change to equals
        && feature.properties.amenity !== 'kindergarten'  // change to equals // przedszkole, zlobek
        && feature.properties.building !== 'kindergarten'  // change to equals // przedszkole, zlobek
        && feature.properties.building !== 'hospital'  // change to equals // przedszkole, zlobek
        && feature.properties.leisure !== 'playground'  // change to equals // przedszkole, zlobek
        && feature.properties.natural !== 'wood'
        && feature.properties.barrier !== 'fence'
        && feature.properties.amenity !== 'parking'
        && feature.properties.landuse !== 'garages'
        && feature.properties.landuse !== 'residential'
        && feature.properties.landuse !== 'commercial'
        && feature.properties.landuse !== 'grass'
        && feature.properties.landuse !== 'forest'
        && feature.properties.landuse !== 'recreation_ground' // park
        && feature.properties.landuse !== 'construction' // park
        && feature.properties.highway !== 'service'
        && feature.properties.natural === undefined
        && feature.properties.building !== 'school' // change to equals
        && feature.properties.building !== 'yes'
        && feature.properties.building !== 'office'
        && feature.properties.building !== 'supermarket'
        && feature.properties.building !== 'garage'
        && feature.properties.building !== 'church'
        && feature.properties.building !== 'service'
        && feature.properties.building !== 'house'
        && feature.properties.building !== 'commercial'
        && feature.properties.building !== 'roof'
        && feature.properties.building !== 'garages'
        && feature.properties.building !== 'residential'
        && feature.properties.landuse !== 'village_green'
        && feature.properties.landuse !== 'meadow'
        && feature.properties.landuse !== 'farmland'
        && feature.properties.leisure !== 'pitch'
        && feature.properties.man_made !== 'bridge'
        && feature.properties.region_category === undefined
        && feature.properties.boundary === undefined
        && feature.properties.construction === undefined
        && feature.properties.building !== 'apartments'
        && feature.properties.railway === undefined
        && feature.properties.historic === undefined
        && feature.properties.building !== 'depot'
        && feature.properties.building !== 'construction'
        && feature.properties.building !== 'transportation'
        && feature.properties.amenity !== 'parking_space'
        && feature.properties.amenity !== 'fuel'
        && feature.properties.amenity !== 'bank'
        && feature.properties.amenity !== 'car_wash'
        && feature.properties.amenity !== 'bicycle_parking'
        && feature.properties.place !== 'island'
        && feature.properties.highway !== 'footway'
        && feature.properties.highway !== 'platform'
      ) {
        filteredFeatures.push(feature);
      }
    }
    geoModel.features = filteredFeatures;
    return geoModel;
  }

  getBusStops(geoModel: Geojsonmodel): Geojsonmodel {
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];

    for (const feature of features) {
      if ( feature.properties.highway === 'bus_stop'  || feature.properties.bus === 'yes') {
        feature.properties.description = 'bus_stop';
        filteredFeatures.push(feature);
      }
    }
    result.features = filteredFeatures;
    return result;
  }

  // kindergarden, university, school
  getSchools(geoModel: Geojsonmodel): Geojsonmodel {
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    for (const feature of features) {

        if (feature.properties.amenity === 'university') {
          feature.properties.description = 'school';
          filteredFeatures.push(feature);
        } else if (feature.properties.amenity === 'kindergarten' || feature.properties.building === 'kindergarten') {
          feature.properties.description = 'school';
          filteredFeatures.push(feature);
        } else if (feature.properties.amenity === 'school' || feature.properties.building === 'school') {
          feature.properties.description = 'school';
          filteredFeatures.push(feature);

        }
      }
    result.features = filteredFeatures;
    return result;
  }

  getTrafficSignal(geoModel: Geojsonmodel): Geojsonmodel {
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    for (const feature of features) {
      if (feature.properties.highway === 'traffic_signals' ) {
        feature.properties.description = 'traffic_signal';
        filteredFeatures.push(feature);
      }
    }
    result.features = filteredFeatures;
    return result;
  }

  getPedestrialCrossing(geoModel: Geojsonmodel): Geojsonmodel {
    var counter = 0;
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    for (let feature of features) {
      if (feature.properties.crossing !== undefined
        && feature.geometry.type === 'Point'
        && feature.properties.crossing === 'uncontrolled') {
        feature.properties.description = 'pedestrian_crossing';
        filteredFeatures.push(feature);
        counter++;
      }
    }
    result.features = filteredFeatures;
    return result;
  }

  getRailCrossing(geoModel: Geojsonmodel): Geojsonmodel {
    const result: Geojsonmodel = JSON.parse(JSON.stringify(geoModel));
    const features: [Feature] = result.features;
    const filteredFeatures: [Feature] = <[Feature]>[];
    for (const feature of features) {
      if (feature.properties.railway === 'level_crossing'
        && feature.geometry.type === 'Point' ) {
        feature.properties.description = 'rail_crossing';
        filteredFeatures.push(feature);
      }
    }
    result.features = filteredFeatures;
    return result;
  }

}
