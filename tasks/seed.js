import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import users from '../data/users.js';
import libraries from '../data/libraries.js';

const db = await dbConnection();
await db.dropDatabase();


let user1 = await users.createUser("Evan", "Jinks", "ejinks2@stevens.edu", "Hello123!", 21, "ejinks2");

let allUsers = await users.getAllUsers();
let user1Id;
allUsers.forEach(x => {
  if (x.emailAddress === "ejinks2@stevens.edu"){
    user1Id = x._id.toString();
  }
});

let library1 = await libraries.create("Evan's Library", 40.1111, -70.2142, "tempimage", user1Id, 3, ['horror']);


console.log("Done seeding the database")

await closeConnection();