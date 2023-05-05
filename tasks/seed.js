import "../env.js";
import { userData, libraryData } from "../data/index.js"
import { dbConnection, closeConnection } from '../config/mongoConnection.js'

let user1, user2, user3, lib1, lib2, lib3;

const db = await dbConnection();
await db.dropDatabase();

// User profile creation
try {
    await userData.createUser("Evan", "Jinks", "ejinks2@stevens.edu", "Hello123!", 21, "ejinks2");
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
try {
    await userData.createUser("Julien", "Carr", "jcarr2@stevens.edu", "Testing123!", "20", "jcarr")
} catch (error) {
    console.log(error)
}

// Library creation
try {
    user1 = await userData.getUserByEmail("ejinks2@stevens.edu");
    lib1 = await libraryData.create("Jackson Street Library", [40.74158452735219, -74.04018872438458], "211 Jackson St, Hoboken NJ, 07030", "http://localhost:3000/public/images/211Jackson.jpeg", user1._id, 3, ['horror']);
} catch (error) {
    console.log(error)
}
try {
    user2 = await userData.getUserByEmail("galapatt@stevens.edu")
    lib2 = await libraryData.create("George's Little Library", [40.74242381352739, -74.03200659795047], "Church Square Park, Hoboken NJ, 07030", "http://localhost:3000/public/images/5thandWillow.jpeg", user2._id, 2, ['mystery', 'horror'])
} catch (error) {
    console.log(error)
}

try {
    user3 = await userData.getUserByEmail("djdauph@icloud.com")
    lib3 = await libraryData.create("The 9th and Clinton Library", [40.748227, -74.032541], "901 Clinton St, Hoboken NJ, 07030", "http://localhost:3000/public/images/9thandClinton.jpeg", user3._id, 5, ['nonFiction', 'fairyTale'])
} catch (error) {
    console.log(error)
}

// Creating comments
try {
    let comment1 = await libraryData.createComment(lib1._id, user3._id, "ddauph", "This is a great library! Had a great selection of books.");
} catch (error) {
    console.log(error)
}

try {
    let comment2 = await libraryData.createComment(lib1._id, user2._id, "galapatt", "There weren't many books when I went. Hopefully someone can add more soon!");
} catch (error) {
    console.log(error)
}

try {
    let comment3 = await libraryData.createComment(lib2._id, user1._id, "ejinks2", "This is a great location! I added some books of my own here.");
} catch (error) {
    console.log(error)
}

// Favorite
try {
    await userData.favoriteLibrary(user1._id, lib2._id);
} catch (error) {
    console.log(error)
}
try {
    await userData.favoriteLibrary(user2._id, lib3._id);
} catch (error) {
    console.log(error)
}

console.log("Done seeding the database!");

await closeConnection();