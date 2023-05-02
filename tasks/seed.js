import {userData,libraryData} from "../data/index.js"
import {dbConnection, closeConnection} from '../config/mongoConnection.js'

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
console.log(allUsers)
allUsers.forEach(x => {
  if (x.emailAddress === "ejinks2@stevens.edu"){
    user1Id = x._id;
  }
});

try {
    lib1 = await libraryData.create("Evan's Library", [40.7440, 74.0324], "44 Clinton Street","tempimage", user1Id, 3, ['horror']);
} catch (error) {
    console.log(error)
}

try {
    await userData.createUser("George","Alapatt","galapatt@stevens.edu","5@4Mx7Eb&z","21","galapatt")
} catch (error) {
    console.log(error)
}
user2 = await userData.getUserByEmail("galapatt@stevens.edu")

try {
    await libraryData.create("Wash Street Library", [40.740652, -74.029897], "406 Washington Street","/public/uploads/1681934019520.png", user2._id, 3.5, ["Fiction","Historical Fiction"])   
} catch (error) {
    console.log(error)
}

try {
    lib2 = await libraryData.getLibraryByName("Wash Street Library")
} catch (error) {
    console.log(error)
}

console.log(lib2)

try {
    await userData.favoriteLibrary(user2._id,lib2._id) 
} catch (error) {
    console.log(error)
}

user2 = await userData.getUserByEmail("galapatt@stevens.edu")
console.log(user2)

await closeConnection();