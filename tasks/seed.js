import "../env.js";
import { userData, libraryData } from "../data/index.js"
import { dbConnection, closeConnection } from '../config/mongoConnection.js'

let user1, user2, lib1, lib2;

const db = await dbConnection();
await db.dropDatabase();
let allUsers, user1Id;

try {
    user1 = await userData.createUser("Evan", "Jinks", "ejinks2@stevens.edu", "Hello123!", 21, "ejinks2");
} catch (error) {
    console.log(error)
}

allUsers = await userData.getAllUsers();

allUsers.forEach(x => {
    if (x.emailAddress === "ejinks2@stevens.edu") {
        user1Id = x._id;
    }
});

try {
    lib1 = await libraryData.create("Evan's Library", [40.74158452735219, -74.04018872438458], "211 Jackson St, Hoboken, NJ, 07030", "http://localhost:3000/public/images/211Jackson.jpeg", user1Id, 3, ['horror']);
} catch (error) {
    console.log(error)
}

try {
    await userData.createUser("George", "Alapatt", "galapatt@stevens.edu", "5@4Mx7Eb&z", "21", "galapatt")
} catch (error) {
    console.log(error)
}
try {
    await userData.createUser("Danielle", "Dauphinais", "djdauph@icloud.com", "123Love!", "20", "ddauph")
} catch (error) {
    console.log(error)
}
user2 = await userData.getUserByEmail("galapatt@stevens.edu")

try {
    await libraryData.create("George's library", [40.74242381352739, -74.03200659795047], "Church Square Park, Hoboken, NJ, 07030", "http://localhost:3000/public/images/5thandWillow.jpeg", user2._id, 2, ['mystery', 'horror'])
} catch (error) {
    console.log(error)
}

try {
    lib2 = await libraryData.getLibraryByName("George's library")
} catch (error) {
    console.log(error)
}

user2 = await userData.getUserByEmail("galapatt@stevens.edu")

let lib2_followers = await userData.getFollowers(lib2._id);

await closeConnection();