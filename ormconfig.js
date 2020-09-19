let fileExt = process.env.NODE_ENV === 'development' ? 'ts' : 'js';
let srcDir = process.env.NODE_ENV === 'development' ? 'src' : 'dist'
let config = {
   "type": "postgres",
   "host": process.env.POSTGRES_HOST,
   "port": 5432,
   "username": process.env.POSTGRES_USERNAME,
   "password": process.env.POSTGRES_PASSWORD,
   "database": process.env.POSTGRES_DATABASE,
   "synchronize": true,
   "logging": false,
    "entities": [
        srcDir + "/repository/entity/**/*." + fileExt
    ],
    "migrations": [
        srcDir + "/repository/migration/**/*." + fileExt
    ],
    "subscribers": [
        srcDir + "/repository/subscriber/**/*." + fileExt
    ],
    "cli": {
        "entitiesDir": srcDir + "/repository/entity",
        "migrationsDir": srcDir + "/repository/migration",
        "subscribersDir": srcDir + "/repository/subscriber"
    },
    "driver_extra": {
        "rejectUnauthorized": false
    }
};
module.exports = config;
