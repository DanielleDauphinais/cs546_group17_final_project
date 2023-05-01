import "./env.js";
import { userData, libraryData } from "./data/index.js";
import { dbConnection, closeConnection } from './config/mongoConnection.js';

let user1, lib1, db;

try {
    console.log("Connecting to the database");

    db = await dbConnection();
} catch (err) {
    console.error("Error while creating a connection to the database");

    /** If we cannot connect to the db, then we should terminate this process with an EXIT_FAILURE status code */
    process.exit(1);
}

try {
    console.log("Dropping the database for a fresh start");

    await db.dropDatabase();
} catch (err) {
    console.error(err);
    console.error("Error while dropping the database");

    /** If we cannot drop the db, then we should terminate this process with an EXIT_FAILURE status code */
    process.exit(1);
}

try {
    console.log("Creating a new user");

    await userData.createUser("George", "Alapatt", "galapatt@stevens.edu", "5@4Mx7Eb&z", "21", "galapatt")
} catch (error) {
    console.error("Error while creating user");
    console.error(error);
}

try {
    console.log("Creating a new user");

    await userData.createUser("Asd", "Asd", "asd@asd.asd", "1Asdfghjkl@1", "21", "Vish")
} catch (error) {
    console.error("Error while creating user");
    console.error(error);
}

try {
    console.log("Getting the newly created user by email");

    user1 = await userData.getUserByEmail("galapatt@stevens.edu")
} catch (err) {
    console.error("Error while getting the user by email");
    console.error(err);
}

try {
    console.log("Creating a library");

    await libraryData.create("Wash Street Library", [40.740652, -74.029897], "Washington Street, Hoboken, NJ", "/public/uploads/1681934019520.png", user1._id.toString(), 3.5, ["Fiction", "Historical Fiction"])
} catch (error) {
    console.error("Error while creating library");
    console.error(error);
}

try {
    console.log("Getting the newly created library via name");

    lib1 = await libraryData.getLibraryByName("Wash Street Library")
} catch (error) {
    console.log("Error while getting the library via name");
    console.error(error);
}

try {
    console.log("Favoriting a library");

    await userData.favoriteLibrary(user1._id.toString(), lib1._id.toString())
} catch (error) {
    console.error("Error while favoruting the library");
    console.error(error)
}

try {
    console.log("Creating a comment");

    await libraryData.createComment(
        lib1._id.toString(), 
        user1._id.toString(),
        user1.userName,
        "This is a nice little library with lots of books"
    );
} catch (err) {
    console.error("Error while adding a comment on the library page");
    console.error(err);
}

/**
 * TODO
 * 1. Editing a comment
 * 2. Deleting a comment
 * 3. Liking a comment
 */

try {
    console.log("Closing the connection");

    await closeConnection();
} catch (err) {
    console.error("Error while closing the connection to the database");
    
    /** If we cannot close the connection, then we should terminate this process with an EXIT_FAILURE status code */
    process.exit(1);
}

console.log("End of seed");
