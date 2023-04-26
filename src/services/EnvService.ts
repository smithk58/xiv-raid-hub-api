import { Singleton } from 'typescript-ioc';

@Singleton
export class EnvService {
    public get isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }
    public get backendBaseURL(): string {
        return process.env.BACKEND_BASE_URL;
    }
    public get frontendBaseURL() {
        return process.env.FRONTEND_BASE_URL;
    }
    public get botBaseURL() {
        return process.env.BOT_BASE_URL;
    }
    public get botAPIKey() {
        return process.env.XIV_RAID_HUB_BOT_API_KEY;
    }
    public get appSecretKey() {
        return process.env.APP_SECRET_KEY;
    }
    public get discordClientID() {
        return process.env.DISCORD_CLIENT_ID;
    }
    public get discordClientSecret() {
        return process.env.DISCORD_CLIENT_SECRET;
    }
    public get fflogsClientId() {
        return process.env.FFLOGS_CLIENT_ID;
    }
    public get fflogsClientSecret() {
        return process.env.FFLOGS_SECRET;
    }
    public get allowedOrigins() {
        return process.env.ALLOWED_ORIGINS ? JSON.parse(process.env.ALLOWED_ORIGINS) as string[] : [];
    }
}
