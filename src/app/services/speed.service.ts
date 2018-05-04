import {Injectable} from '@angular/core';
import {Feature} from '../models/feature';
import {MapDataOperations} from '../mapDataOperations';

@Injectable()
export class SpeedService {
  public static getMaxSpeed(feature: Feature): number {

    if (feature.properties.maxSpeed !== undefined) {
      return Number(feature.properties.maxSpeed);
    } else if (this.getMaxSpeedByGround(feature) !== 0) {
      return this.getMaxSpeedByGround(feature);
    } else if (this.getMaxSpeedByStreetType(feature) !== 0) {
      return this.getMaxSpeedByStreetType(feature);
    } else {
      return this.getMaxSpeedByStreetLength(feature.geometry.coordinates);
    }
  }

  private static getMaxSpeedByGround(feature: Feature): number {
    if (feature.properties.surface === 'paving_stones'
      || feature.properties.surface === 'cobblestone'
      || feature.properties.surface === 'ground'
      || feature.properties.surface === 'sett'
      || feature.properties.surface === 'concrete:plates') {
      return 20;
    } else if (feature.properties.surface === 'gravel'
      || feature.properties.surface === 'dirt'
      || feature.properties.surface === 'sand'
      || feature.properties.surface === 'fine_gravel'
      || feature.properties.surface === 'pebblestone') {
      return 10;
    } else if (feature.properties.surface === 'unpaved') {
      return 30;
    } else {
      return 0;
    }
  }

  private static getMaxSpeedByStreetLength(coordinates: [[number, number]]): number {
    const arrayOfLengths = MapDataOperations.getStreetLength(coordinates);
    const length = arrayOfLengths[arrayOfLengths.length - 3] * 111196.672;

    if (length < 100) {
      return 30;
    } else if (length < 500) {
      return 50;
    } else if (length < 1000) {
      return 70;
    } else {
      return 80;
    }
  }


  public static getMaxSpeedByStreetType(feature: Feature): number {
    if (feature.properties.highway === 'residential' || feature.properties.highway === 'living_street') {
      return 30;
    } else if (feature.properties.highway === 'motorway_link' || feature.properties.highway === 'secondary') {
      return 70;
    } else if (feature.properties.highway === 'primary') {
      return 80;
    } else if (feature.properties.highway === 'motorway') {
      return 140;
    }
    return 0;
  }


}
