let fileExt = process.env.NODE_ENV === 'development' ? 'ts' : 'js';
let srcDir = process.env.NODE_ENV === 'development' ? 'src' : 'dist'
let config = {
    "type": "postgres",
    "url": process.env.DB_URL,
    "extra": {
        "ssl": {
            "rejectUnauthorized": false
        }
    },
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
    }
};
module.exports = config;
