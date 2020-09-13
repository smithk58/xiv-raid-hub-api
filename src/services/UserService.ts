import { APIUser } from "discord-api-types";
import { getConnection } from "typeorm";
import { User } from "../repository/entity/User";
import * as moment from "moment-timezone";
import { RContext } from "../routes/raid-group-router";

export default class UserService {
    public static async login(discordUser: APIUser): Promise<User> {
        const userRepository = getConnection().getRepository(User);
        // Check if user exists, if so return their details, otherwise create a user for them
        const existingUser = await userRepository.findOne( {
            discordId: discordUser.id
        });
        if (existingUser) {
           return this.onLoginUpdate(existingUser, discordUser);
        } else {
            return this.createUser(discordUser);
        }
    }
    public static async getUser(userId: number): Promise<User> {
        return getConnection().getRepository(User).findOne(userId);

    }
    public static async createUser(discordUser: APIUser): Promise<User> {
        const userRepository = getConnection().getRepository(User);
        const user = new User();
        user.discordId = discordUser.id;
        user.username = discordUser.username;
        user.email = discordUser.email;
        user.createdOn = new Date();
        user.lastLogin = new Date();
        return userRepository.save(user);
    }

    /**
     * Updates properties on the user that should be checked/updated on every login.
     * @param user
     * @param discordUser
     * @private
     */
    private static async onLoginUpdate(user: User, discordUser: APIUser): Promise<User> {
        const userRepository = getConnection().getRepository(User);
        // Update username/email from discord and last login
        user.username = discordUser.username;
        user.email = discordUser.email;
        user.lastLogin = new Date();
        return userRepository.save(user);
    }

    /**
     * Attempts to build a more user friendly timezone out of the browsers timezone.
     */
    public static getPrettyTimezone(timezone: string): string {
        const abrvTimezone = timezone ? moment().tz(timezone).format('z'): timezone;
        // Build <timezone> (<abrv timezone>), since most users recognize that over the more official one
        return abrvTimezone ? abrvTimezone + ' ('+timezone+')' : timezone;
    }
    public static getAvatarUrl(discordUser: APIUser): string {
        let avatarURL = 'https://cdn.discordapp.com/';
        if(discordUser.avatar) {
            avatarURL += 'avatars/' + discordUser.id + '/' + discordUser.avatar
        } else {
            const defaultImage = parseInt(discordUser.discriminator, 10) % 5;
            avatarURL += 'embed/avatars/' + defaultImage;
        }
        return avatarURL += '.png?size=128';
    }
    public static errorIfNotAuthed(ctx: RContext) {
        // TODO Actual auth/route protection using JWT, this is just memes, https://stackoverflow.com/questions/63048522/protect-only-certain-routes-with-koa-jwt
        if(!ctx.session || !ctx.session.user) {
            ctx.send(401)
            ctx.res.end();
        }
    }
}
