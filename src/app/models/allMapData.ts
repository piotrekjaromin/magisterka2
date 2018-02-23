import {Road} from './road';

export class AllMapData {
  constructor(public type: string,
              public features: [Road]
  ) {}
}
