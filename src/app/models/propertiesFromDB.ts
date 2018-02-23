import {PropertiesInterface} from './propertiesInterface';

export class PropertiesModel implements PropertiesInterface{
  constructor(public highway: string,
              public surface: string
) {}
}
