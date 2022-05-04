import { Singleton } from 'typescript-ioc';

@Singleton
export class EnvService {
    public get isDevelopment() {
        return process.env.NODE_ENV === 'dev';
    }
    public get backendBaseURL(): string {
        return process.env.BACKEND_BASE_URL || 'https://api.xivraidhub.com';
    }
    public get frontendBaseURL() {
        return process.env.FRONTEND_BASE_URL || 'https://www.xivraidhub.com/';
    }
    public get botBaseURL() {
        return process.env.BOT_BASE_URL || 'https://bot.xivraidhub.com';
    }
    public get botAPIKey() {
        return process.env.XIV_RAID_HUB_BOT_API_KEY;
    }
    public get appSecretKey() {
        return process.env.APP_SECRET_KEY;
    }
    public get discordClientID() {
        return process.env.DISCORD_CLIENT_ID || '746485131534925974';
    }
    public get discordClientSecret() {
        return process.env.DISCORD_CLIENT_SECRET;
    }
    public get fflogsClientId() {
        return process.env.FFLOGS_CLIENT_ID || '921e69e9-51b6-4938-80e9-bbab592b3e93';
    }
    public get fflogsClientSecret() {
        return process.env.FFLOGS_SECRET;
    }
    public get allowedOrigins() {
        return process.env.ALLOWED_ORIGINS ?
            JSON.parse(process.env.ALLOWED_ORIGINS) as string[] :
            ['https://www.xivraidhub.com', 'https://bot.xivraidhub.com'];
    }
}
