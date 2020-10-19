export class User {
    constructor(id: number, discordId: string, username: string, avatarURL: string, timezone?: string) {
        this.id = id;
        this.discordId = discordId;
        this.username = username;
        this.avatarURL = avatarURL;
        this.timezone = timezone;
    }
    id: number;
    discordId: string;
    username: string;
    avatarURL: string;
    timezone?: string;
}
