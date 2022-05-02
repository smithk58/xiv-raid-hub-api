import { Inject, Singleton } from 'typescript-ioc';
import fetch, { Response } from 'node-fetch';
import { gql, GraphQLClient } from 'graphql-request';

import { Query, Region, Server, Spec } from '../../../fflogs-types';
import { URLSearchParams } from 'url';
import { EnvService } from '../../EnvService';
import { CacheService } from '../../CacheService';
import { XIVClasses } from '../../../constants';

@Singleton
export class FFLogsAPI {
    private static baseURL = 'https://www.fflogs.com/api/v2/client';
    @Inject private envService: EnvService;
    @Inject private cacheService: CacheService;
    private publicAccessToken: string;
    private client = new GraphQLClient(FFLogsAPI.baseURL);

    /**
     * Returns a list of FF14 classes.
     */
    public async getClasses() {
        /*const cacheKey = 'ffClasses';
        let classes =  this.cacheService.get<Spec[]>(cacheKey);
        // TODO recently started throwing an error for no apparent reason if you query specs or anything below it
        if (classes === undefined) {
            const query = /!* GraphQL*!/ gql`
                {
                    gameData {
                        classes {
                            id,
                            name,
                            specs {
                                id,
                                name
                            }
                        }
                    }
                }
            `;
            const result = await this.client.request<Query>(query);
            // TODO error handling https://www.npmjs.com/package/graphql-request
            classes = result.gameData.classes[0].specs;
            this.cacheService.set<Spec[]>(cacheKey, classes);
        }*/
        return XIVClasses;
    }

    /**
     * Returns a list of FF14 server regions.
     */
    public async getRegions() {
        const cacheKey = 'ffRegions';
        let regions =  this.cacheService.get<Region[]>(cacheKey);
        if (regions === undefined) {
            const query = /* GraphQL*/ gql`
                {
                    worldData {
                        regions {
                            id,
                            name,
                            slug
                        }
                    }
                }
            `;
            const result = await this.client.request<Query>(query);
            // TODO error handling https://www.npmjs.com/package/graphql-request
            regions = result.worldData.regions;
            this.cacheService.set<Region[]>(cacheKey, regions);
        }
        return regions;
    }

    /**
     * Returns a list of FF14 servers.
     */
    public async getServers() {
        const cacheKey = 'ffServers';
        let servers =  this.cacheService.get<Server[]>(cacheKey);
        if (servers === undefined) {
            const query = /* GraphQL*/ gql`
                {
                    worldData {
                        regions {
                            servers {
                                data {
                                    id,
                                    name,
                                    slug
                                }
                            }
                        }
                    }
                }
            `;
            const result = await this.client.request<Query>(query);
            // TODO error handling
            servers = [];
            for (const region of result.worldData.regions) {
                servers = servers.concat(region.servers.data);
            }
            this.cacheService.set<Server[]>(cacheKey, servers);
        }
        return servers;
    }

    /**
     * Returns a character. Useful for getting the characters FFlogs character ID for doing other character specific operations.
     * @param name - The name of the character to search for.
     * @param serverSlug - The FFlogs server slug of the character.
     * @param serverRegion - The region of the server.
     */
    public async getCharacter(name: string, serverSlug: string, serverRegion: string) {
        const variables = {
            name,
            serverSlug,
            serverRegion
        };
        const query = /* GraphQL*/ gql`
            query getCharacter($name: String, $serverSlug: String, $serverRegion: String) {
                characterData {
                    character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
                        id,
                        name
                    }
                }
            }
        `;
        const result = await this.client.request<Query>(query, variables);
        // TODO error handling https://www.npmjs.com/package/graphql-request
        return result.characterData.character;
    }
    public publicTokenIsSet() {
        return typeof(this.publicAccessToken) !== 'undefined';
    }

    /**
     * Requests a new public access token from FFLogs and sets it on the graphQL client.
     */
    public async setPublicToken() {
        const result = await this.requestToken().catch((error) => {
            throw new Error('Unable to access FFlogs API. ' + error.statusText);
        });
        if (result) {
            this.publicAccessToken = result.access_token;
            this.client.setHeader('authorization', 'Bearer ' + this.publicAccessToken);
        }
    }

    /**
     * Requests a new public access token from FFLogs
     */
    private async requestToken() {
        // Client credentials flow from https://www.fflogs.com/api/docs#client-credentials-flow
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        // Base 64 encode the client_id:client_secret
        const basicAuth = Buffer.from(this.envService.fflogsClientId + ':' + this.envService.fflogsClientSecret).toString('base64');
        const response = await fetch('https://www.fflogs.com/oauth/token', {
            method: 'POST',
            body: params,
            headers: {authorization: 'Basic ' + basicAuth}
        });
        return this.handleResponse(response);
    }
    private async handleResponse(response: Response) {
        if (response.status !== 200) {
            return Promise.reject(response);
        }
        return response.json();
    }
}
