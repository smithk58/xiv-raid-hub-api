import { Singleton } from 'typescript-ioc';

import * as NodeCache from 'node-cache';
import { Key } from 'node-cache';

@Singleton
export class CacheService {
    cache = new NodeCache({
        useClones: false
    });
    get<T>(key: Key): T | undefined {
        return this.cache.get<T>(key);
    }
    set<T>(key: Key, value: T) {
        return this.cache.set<T>(key, value);
    }
}
