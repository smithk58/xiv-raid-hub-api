import { IdNamePair } from './IdNamePair';

export interface SimpleGuild extends IdNamePair {
    channels?: IdNamePair[];
    roles?: IdNamePair[];
}
