import { User } from '../repository/entity/User';

export class Session {
    constructor(user?: User, timezone?: string) {
        this.prettyTimezone = timezone;
        this.isLoggedIn = !!user;
        this.user = user;
    }
    prettyTimezone: string;
    isLoggedIn: boolean;
    user?: User;
}
