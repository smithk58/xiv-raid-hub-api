import { Inject, Singleton } from 'typescript-ioc';
import fetch, { Response } from 'node-fetch';
import { gql, GraphQLClient } from 'graphql-request';

import { Query } from '../../../fflogs-types';
import { URLSearchParams } from 'url';
import { EnvService } from '../../EnvService';

@Singleton
export class FFLogsAPI {
    private static baseURL = 'https://www.fflogs.com/api/v2/client';
    @Inject private envService: EnvService;
    private publicAccessToken: string;
    private client = new GraphQLClient(FFLogsAPI.baseURL);
    public async getClasses() {
        const query = /* GraphQL*/ gql`
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
        // TODO error handling
        return result.gameData.classes[0].specs;
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
