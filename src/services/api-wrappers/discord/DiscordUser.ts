/**
 * https://discord.com/developers/docs/resources/user#user-object
 * // TODO preference for discord-api-types, but they have compile issues
 */
export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    locale?: string;
    verified?: boolean;
    email?: string | null;
}
