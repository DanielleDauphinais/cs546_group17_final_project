import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import users from '../data/users.js';
import libraries from '../data/libraries.js';

const db = await dbConnection();
await db.dropDatabase();

try {
  let user1 = await users.createUser("Evan", "Jinks", "ejinks2@stevens.edu", "Hello123!", 21, "ejinks2");

  let allUsers = await users.getAllUsers();
  let user1Id;
  allUsers.forEach(x => {
    if (x.emailAddress === "ejinks2@stevens.edu"){
      user1Id = x._id.toString();
    }
  });
} catch (e) {
  console.log(e);
}

try {
  let library1 = await libraries.create("Evan's Library", [40.7440, -74.0324], "tempimage", user1Id, 3, ['horror']);
} catch (e) {
  console.log(e)
}

try {
  let user2 = await users.createUser("Daniel", "Smith", "dsmith@stevens.edu", "Test123!!", 30, "dsmith");

  allUsers = await users.getAllUsers();
  let user2Id;
  allUsers.forEach(x => {
    if (x.emailAddress === "dsmith@stevens.edu"){
      user2Id = x._id.toString();
    }
  });
} catch (e) {
  console.log(e)
}

try {
  let library2 = await libraries.create("Daniel's library", [40.7441, -74.0532], "temporary", user2Id, 2, ['mystery', 'horror']);
} catch (e) {
  console.log(e)
}

console.log("Done seeding the database")

await closeConnection();