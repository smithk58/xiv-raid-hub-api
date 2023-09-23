import { DeleteResult, EntityManager } from 'typeorm';
import { Inject, Singleton } from 'typescript-ioc';
import { DiscordUser } from './api-wrappers/discord/DiscordUser';
import * as moment from 'moment-timezone';

import { User } from '../repository/entity/User';
import { RContext } from '../routes/raid-group-router';
import { UserSetting } from '../repository/entity/UserSetting';
import * as Properties from '../models/user-settings/properties';
import { IProperty, PropertyValue } from '../models/user-settings/IProperty';
import { PropertyService } from './PropertyService';
import AppDataSource from '../db-connection';

@Singleton
export class UserService {
    @Inject private propertyService: PropertyService;
    properties: Record<string, IProperty<PropertyValue>>;
    constructor() {
        this.properties = this.propertyService.loadProperties(Properties);
    }
    /**
     * Logs in the specified discord user. Creates or updates a user with the discord users information.
     * @param discordUser - The discord user to login as.
     * @param timezone - The users timezone.
     */
    public async login(discordUser: DiscordUser, timezone: string): Promise<User> {
        // Check if user exists, if so return their details, otherwise create a user for them
        const existingUser = await this.getUserByDiscordId(discordUser.id);
        if (existingUser) {
           return this.onLoginUpdate(existingUser, discordUser, timezone);
        } else {
            return this.createUser(discordUser, timezone);
        }
    }

    /**
     * Returns the specified user.
     * @param userId - The ID of the user to retrieve.
     */
    public async getUser(userId: number): Promise<User> {
        return AppDataSource.getRepository(User).findOne({where: {id: userId}});
    }
    public async getUserByDiscordId(discordId: string): Promise<User> {
        return AppDataSource.getRepository(User).findOne( {where: {discordId}});
    }
    /**
     * Creates a user from the specified discord user.
     * @param discordUser - The discord user to create a user from.
     * @param timezone - The users timezone.
     */
    public async createUser(discordUser: DiscordUser, timezone: string): Promise<User> {
        const user = new User();
        user.discordId = discordUser.id;
        user.username = discordUser.username;
        user.email = discordUser.email;
        user.createdOn = new Date();
        user.lastLogin = new Date();
        if (this.isValidTimezone(timezone)) {
            user.timezone = timezone;
        }
        return AppDataSource.getRepository(User).save(user);
    }

    public async getSettings(userId: number) {
        const settings = await AppDataSource
            .getRepository(UserSetting)
            .createQueryBuilder('us')
            .where('us."userId" = :userId', {userId})
            .getMany();
        const settingsMap = settings.reduce((map: Record<string, string>, setting: UserSetting) => {
            map[setting.key] = setting.value;
            return map;
        }, {});
        return this.propertyService.resolvePropertyValueMap(this.properties, settingsMap);
    }
    public async updateSettings(userId: number, settings: Record<string, PropertyValue>) {
        this.propertyService.validatePropertyValues(this.properties, settings);
        const keysToDelete: string[] = [];
        const newSettings: UserSetting[] =  [];
        for (const key of Object.keys(settings)) {
            const property = this.properties[key];
            const value = settings[key];
            // Delete properties that are being set to default, insert/update others
            if (property.isDefault(value)) {
                keysToDelete.push(key);
            } else {
                newSettings.push(new UserSetting(userId, key, property.valueToString(value)));
            }
        }
        return AppDataSource.transaction(async (entityManager: EntityManager) => {
            if (keysToDelete.length > 0) {
                await this.deleteSettings(entityManager, userId, keysToDelete);
            }
            return await entityManager.getRepository(UserSetting).save(newSettings);
        });
    }
    /**
     * Attempts to build a more user friendly timezone out of the browsers timezone.
     * @param timezone - The timezone to get a pretty timezone for.
     */
    public getPrettyTimezone(timezone: string): string {
        // Build <timezone> (<abrv timezone>), since most users recognize that over the more official one
        let abrvTimezone = timezone;
        if (this.isValidTimezone(timezone)) {
            abrvTimezone = moment().tz(timezone).format('z') + ' (' + timezone + ')';
        }
        return abrvTimezone;
    }

    /**
     * Builds a discord avatar URL from the specified discord users settings.
     * @param discordUser - The discord user to build an avatar URL for.
     */
    public getAvatarUrl(discordUser: DiscordUser): string {
        let avatarURL = 'https://cdn.discordapp.com/';
        if (discordUser.avatar) {
            avatarURL += 'avatars/' + discordUser.id + '/' + discordUser.avatar;
        } else {
            const defaultImage = parseInt(discordUser.discriminator, 10) % 5;
            avatarURL += 'embed/avatars/' + String(defaultImage);
        }
        return avatarURL + '.png?size=128';
    }
    /**
     * Checks the current session for a user, and throws a 401 if one isn't found.
     * @param ctx - The context to search for a user session on.
     */
    public errorIfNotAuthed(ctx: RContext) {
        /* eslint-disable */
        if (!ctx.session || !ctx.session.user) {
            ctx.unauthorized ();
            ctx.res.end();
        }
        /* eslint-enable */
    }
    private async deleteSettings(entityManager: EntityManager, userId: number, keys: string[]): Promise<DeleteResult> {
        return entityManager.createQueryBuilder()
            .delete()
            .from(UserSetting)
            .where('"userId" = :userId AND "key" IN (:...keys)', {userId, keys})
            .execute();
    }
    /**
     * Updates properties on the user that should be checked/updated on every login.
     * @param user - The user to update.
     * @param discordUser - The discord user to use as a source for update values.
     * @param timezone - The users timezone.
     */
    private async onLoginUpdate(user: User, discordUser: DiscordUser, timezone: string): Promise<User> {
        const userRepository = AppDataSource.getRepository(User);
        // Update username/email from discord and last login
        user.username = discordUser.username;
        user.email = discordUser.email;
        if (this.isValidTimezone(timezone)) {
            user.timezone = timezone;
        }
        user.lastLogin = new Date();
        return userRepository.save(user);
    }
    private isValidTimezone(timezone: string): boolean {
        return moment.tz.zone(timezone) != null;
    }
}
