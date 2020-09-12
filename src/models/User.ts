export class User {
    constructor(id: number, username: string, avatarURL: string) {
        this.id = id;
        this.username = username;
        this.avatarURL = avatarURL;
    }
    id: number;
    username: string
    avatarURL: string;
    timezone?: string;
}
