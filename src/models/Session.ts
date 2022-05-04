import { User } from '../repository/entity/User';

export class Session {
    prettyTimezone: string;
    isLoggedIn: boolean;
    user?: User;

    constructor(user?: User, timezone?: string) {
        this.prettyTimezone = timezone;
        this.isLoggedIn = !!user;
        this.user = user;
    }
}
