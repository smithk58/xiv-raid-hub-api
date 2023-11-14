import { DataSource } from 'typeorm';

const isDev = process.env.NODE_ENV === 'development';
const srcDir = isDev ? 'src' : 'dist'
const fileExt = isDev ? 'ts' : 'js';
const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [srcDir+'/repository/entity/**/*.'+fileExt],
    migrations: [srcDir+'/repository/migration/**/*.'+fileExt],
    subscribers: [srcDir+'/repository/subscriber/**/*.'+fileExt],
    ssl: {
        rejectUnauthorized: false
    },
    logging: ['error'],
    synchronize: isDev
});

export default AppDataSource;
