import {userData,libraryData} from "./data/index.js"

try {
    await userData.createUser("George","Alapatt","galapatt@stevens.edu","5@4Mx7Eb&z","21","galapatt")
} catch (error) {
    console.log(error)
}
const user1 = await userData.getUserByEmail("galapatt@stevens.edu")
try {
    await libraryData.create("Wash Street Library", [40.740652, -74.029897], "/public/uploads/1681934019520.png", user1._id.toString(), 3.5, ["Fiction","Historical Fiction"])   
} catch (error) {
    console.log(error)
}

try {
    const lib1 = await libraryData.getLibraryByName("Wash Street Library")
} catch (error) {
    console.log(error)
}

console.log(user1)
console.log(lib1)

try {
    await userData.favoriteLibrary(user1._id.toString(),lib1._id.toString()) 
} catch (error) {
    console.log(error)
}

process.exit()
