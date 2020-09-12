module.exports = {
   "type": "postgres",
   "host": process.env.POSTGRES_HOST,
   "port": 5432,
   "username": process.env.POSTGRES_USERNAME,
   "password": process.env.POSTGRES_PASSWORD,
   "database": process.env.POSTGRES_DATABASE,
   "synchronize": true,
   "logging": false,
   "entities": [
      "src/repository/entity/**/*.ts"
   ],
   "migrations": [
      "src/repository/migration/**/*.ts"
   ],
   "subscribers": [
      "src/repository/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "src/repository/entity",
      "migrationsDir": "src/repository/migration",
      "subscribersDir": "src/repository/subscriber"
   },
   "driver_extra": {
      "rejectUnauthorized": false
   }
}
