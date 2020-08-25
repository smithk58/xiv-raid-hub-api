import { APIUser } from "discord-api-types/default";

export class FESession {
    constructor (discordUser: APIUser) {
        // Whether or not a user is authed is based on if we have a valid discord user
        this.isLoggedIn = !!discordUser;
        if (discordUser) {
            this.user = {
                username: discordUser.username,
                discordAvatar: discordUser.avatar
            };
        }
    }
    isLoggedIn: boolean;
    user?: {
        username: string,
        discordAvatar?: string;
    };
}
