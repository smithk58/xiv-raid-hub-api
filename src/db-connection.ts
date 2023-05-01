import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: ['dist/repository/entity/*/*.js'],
    migrations: ['dist/repository/migration/*/*.js'],
    subscribers: ['dist/repository/subscriber/*/*.js'],
    ssl: {
        rejectUnauthorized: false
    }
});

export default AppDataSource;
