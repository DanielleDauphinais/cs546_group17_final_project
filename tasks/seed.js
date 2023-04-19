import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import users from './users.js';
import libraries from './libraries.js';

const db = await dbConnection();
await db.dropDatabase();

// Add seeding here

console.log("Done seeding the database")

await closeConnection();