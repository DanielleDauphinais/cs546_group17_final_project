import { users } from "../config/mongoCollections.js";
import { libraries } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import validation from "../public/js/validators/validation.js";
import libraryFunctions from "./libraries.js";
import bcrypt from "bcrypt";
import {
  validationsForCheckUser,
  validationsForCreateUser,
} from "../public/js/validators/user.js";

const userCollection = await users();
const libraryCollection = await libraries();

let exportedMethods = {
  async getAllUsers() {
    const userCollection = await users();
    const userList = await userCollection.find({}).toArray();
    return userList.map((user) => {
      user._id = user._id.toString();
      return user;
    });
  },
  async getUserById(id) {
    id = validation.checkValidId(id, "user_id");
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!user) throw "Error: User not found";
    user._id = user._id.toString();
    return user;
  },
  async getUserByEmail(email) {
    email = validation.checkEmail(validation.checkString(email));
    const userCollection = await users();
    const user = await userCollection.findOne({ emailAddress: email });
    if (!user) throw "Error: User not found";
    user._id = user._id.toString();
    return user;
  },
  async favoriteLibrary(userId, libraryId) {
    userId = validation.checkValidId(userId);
    libraryId = validation.checkValidId(libraryId);

    // Check if library exists
    let library = await libraryFunctions.get(libraryId);
    if(library.ownerID === userId){
      throw "Error: Owner can not like their own library."
    }
    // Add libraryId to user's favorited libraries
    const userCollection = await users();

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (user === null) throw "Error: No user found with given ID.";
    user._id = user._id.toString();

    // If the user has not already favorited this library
    if (!user.favLibraries.includes(libraryId)) {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { favLibraries: libraryId } }
      );

      await libraryCollection.updateOne(
        { _id: new ObjectId(libraryId) },
        { $push: { favorites: userId } }
      );
    }
    // If the user has already favorited this library
    else {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { favLibraries: libraryId } }
      );

      await libraryCollection.updateOne(
        { _id: new ObjectId(libraryId) },
        { $pull: { favorites: userId } }
      );
    }
  },
  async getAllFavoritedLibraries(userId) {
    userId = validation.checkValidId(userId);

    // Returns only the array containing the user's favorited libraries
    const userCollection = await users();
    const favorites = await userCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 0, favLibraries: 1 } }
    );
    if (favorites === null) throw "Error: No user found with given ID.";
    return favorites;
  },

  /**
   * This function will create a new user for the given details
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} emailAddress
   * @param {string} password
   * @param {Number} age
   * @param {string} userName
   */
  async createUser(firstName, lastName, emailAddress, password, age, userName) {
    validationsForCreateUser(
      firstName.trim(),
      lastName.trim(),
      emailAddress.trim(),
      password,
      Number(age),
      userName.trim()
    );

    firstName = firstName.trim();
    lastName = lastName.trim();
    emailAddress = emailAddress.trim();
    emailAddress = emailAddress.toLowerCase();
    userName = userName.trim().toLowerCase();

    let userFromDB = await userCollection.findOne({ emailAddress });

    if (userFromDB) throw "VError: User already exists with this email address";

    userFromDB = await userCollection.findOne({ userName });

    if (userFromDB) throw "VError: Username is already taken";

    password = await bcrypt.hash(password, await bcrypt.genSalt(10));

    let newUser = {
      firstName,
      lastName,
      emailAddress,
      password,
      age: Number(age),
      userName,
      dateCreated: new Date().toLocaleDateString(),
      favLibraries: [],
      ownedLibraries: [],
    };

    const { acknowledged, insertedId } = await userCollection.insertOne(
      newUser
    );

    if (!acknowledged || !insertedId) throw "VError: Couldn't add user";
    return { insertedUser: true };
  },

  async addOwnedLibrary(userId, libraryId) {
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    const userCollection = await users();

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (user === null) throw "VError: No user found with given ID.";

    // If the user has already favorited this
    if (user.ownedLibraries.includes(libraryId))
      throw "VError: User has already owns this library";

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { ownedLibraries: libraryId } }
    );
  },

  /**
   * @name dropOwnedLibrary
   * @author jcarr2
   * @param userId
   * @param libraryId
   */
  async dropOwnedLibrary(userId, libraryId) {
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    const userCollection = await users();

    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (user === null) throw "VError: No user found with given ID.";

    if (!user.ownedLibraries.includes(libraryId))
      throw "VError: User does not own this library";

    try {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { ownedLibraries: libraryId } }
      );
    } catch (e) {
      throw "VError: Could not update user";
    }
  },
  /**
   * This function will validate the given user credentials
   * @param {string} emailAddress
   * @param {string} password
   */
  async checkUser(emailAddress, password) {
    validationsForCheckUser(emailAddress.trim(), password);
    emailAddress = emailAddress.trim();
    emailAddress = emailAddress.toLowerCase();

    let userFromDB = await userCollection.findOne({ emailAddress });

    if (!userFromDB) throw "Either the email address or password is invalid";

    let {
      firstName,
      lastName,
      emailAddress: email,
      _id,
      userName,
    } = userFromDB;

    let isValid = await bcrypt.compare(password, userFromDB.password);

    if (isValid)
      return {
        firstName,
        lastName,
        emailAddress: email,
        _id: _id.toString(),
        userName,
      };
    throw "Either the email address or password is invalid";
  },

  /**
   * This function will update a user's profile with the given information.
   * @param {string} id
   * @param {string} firstName 
   * @param {string} lastName 
   * @param {string} emailAddress 
   * @param {string} password 
   * @param {Number} age 
   * @param {string} userName 
   */
  async update (id,firstName, lastName, emailAddress, password, age, userName) {
    
    id = validation.checkValidId(id,"User ID")
    validationsForCreateUser(firstName.trim(), lastName.trim(), emailAddress.trim(), password, Number(age), userName);

    firstName = firstName.trim();
    lastName = lastName.trim();
    emailAddress = emailAddress.trim().toLowerCase();
    userName = userName.toLowerCase();

    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(id)});
    if (!user) throw 'VError: User not found';

    let isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw "Invalid Password";

    let userFromDB = await userCollection.findOne({ emailAddress: emailAddress });
    if (user.emailAddress !== emailAddress && userFromDB) throw "VError: User already exists with your new email address";

    userFromDB = await userCollection.findOne({ userName : userName });
    if (user.userName !== userName && userFromDB) throw "VError: User already exists with your new username";

    let updateUser = {
      firstName : firstName, 
      lastName : lastName, 
      emailAddress : emailAddress,
      age: Number(age),
      userName : userName 
    }

    let same = true
    for (const key in updateUser) {
        if (updateUser[key] !== user[key]) same = false;
    }
    
    if (same) throw "Error: No changes have been made.";

    const updateInfo = await userCollection.findOneAndUpdate(
      {_id: new ObjectId(id)},
      {$set: updateUser},
      {returnDocument: 'after'}
    );

    if (updateInfo.lastErrorObject.n === 0)
      throw `VError: Update failed, could not find the searched user`;

    return {updatedUser : true};

  },
  /**
   * This function gets a list of all the followers of a library.
   * @param {string} libraryId
    */
  async getFollowers(libraryId) {
    libraryId = validation.checkValidId(libraryId);

    await libraryFunctions.get(libraryId)
    
    const userCollection = await users();
    let followers = await userCollection.find({ favLibraries: { $in: [libraryId] } }).toArray(function(err) { 
      if (err) throw "Error: " + err; 
    });
    
    return followers.map((user) => {
      user._id = user._id.toString();
      return user;
    });
  }
};

export default exportedMethods;
