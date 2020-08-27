import { APIUser } from "discord-api-types/default";

export class FESession {
    constructor (discordUser: APIUser) {
        // Whether or not a user is authed is based on if we have a valid discord user
        this.isLoggedIn = !!discordUser;
        if (discordUser) {
            this.user = {
                username: discordUser.username,
                avatarURL: this.getAvatar(discordUser),
            };
        }
    }
    isLoggedIn: boolean;
    user?: {
        username: string
        avatarURL: string;
    };
    private getAvatar(user: APIUser) {
        let avatarURL = 'https://cdn.discordapp.com/';
        if(user.avatar) {
            avatarURL += 'avatars/' + user.id + '/' + user.avatar
        } else {
            const defaultImage = parseInt(user.discriminator, 10) % 5;
            avatarURL += 'embed/avatars/' + defaultImage;
        }
        return avatarURL += '.png?size=128';
    }
}
