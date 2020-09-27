export class User {
    constructor(id: number, username: string, avatarURL: string, timezone?: string) {
        this.id = id;
        this.username = username;
        this.avatarURL = avatarURL;
        this.timezone = timezone;
    }
    id: number;
    username: string;
    avatarURL: string;
    timezone?: string;
}
