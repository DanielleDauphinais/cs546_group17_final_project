import {users} from '../config/mongoCollections.js';
import {libraries} from "../config/mongoCollections.js";
import {ObjectId} from 'mongodb';
import validation from '../public/js/validators/validation.js';
import libraryFunctions from './libraries.js';
import bcrypt from 'bcrypt';

let exportedMethods = {
  async getAllUsers() {
    const userCollection = await users();
    const userList = await userCollection.find({}).toArray();
    return userList;
  },
  async getUserById(id) {
    id = validation.checkValidId(id,"user_id");
    const userCollection = await users();
    const user = await userCollection.findOne({_id: ObjectId(id)});
    if (!user) throw 'Error: User not found';
    return user;
  },
  async createUser(
    firstName,
    lastName,
    email,
    age,
    username,
    password
  ) {
    firstName = validation.checkName(firstName);
    lastName = validation.checkName(lastName);
    email = validation.checkEmail(email);
    age = validation.isValidNumber(age, "Age");
    username = validation.checkString(username);
    password = validation.checkPassword(password);

    // Check if user already exists
    const userCollection = await users();
    const existingUser = await userCollection.findOne({email: email});
    if (existingUser !== null) throw "A user already exists with the given email address.";
    
    // Password Hashing
    const saltRounds = 16;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let newUser = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      age: age,
      username: username,
      password: hashedPassword,
      dateCreated: new Date().toLocaleDateString(),
      favLibraries: [],
      ownedLibraries: []
    }

    // Add the user
    const userInfo = await userCollection.insertOne(newUser);
    if (!userInfo.acknowledged || !userInfo.insertedId) throw "Error: Could not add user.";
  },
  async checkUser(email, password) {
    // Checks the user's credentials when logging in
    email = validation.checkEmail(email);
    password = validation.checkPassword(password);

    const userCollection = await users();
    const existingUser = await userCollection.findOne({email: email});
    if (existingUser === null) throw "Either the email address or password is invalid";

    const compare = await bcrypt.compare(password, existingUser.password);
    if (!compare) throw "Either the email address or password is invalid";
  },
  async favoriteLibrary(userId, libraryId) {
    userId = validation.checkValidId(userId);
    libraryId = validation.checkValidId(libraryId);

    // Check if library exists
    const libraryCollection = await libraries();
    const library = await libraryCollection.findOne(
        {_id: new ObjectId(libraryId)},
    );
    if (library === null) throw "Error: No library found with given ID.";

    // Add libraryId to user's favorited libraries
    const userCollection = await users();

    const user = userCollection.findOne({ _id: new ObjectId(userId) });
    if (user === null) throw "Error: No user found with given ID.";
    
    // If the user has not already favorited this library
    if (!user.favLibraries.includes(libraryId)) {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: {favLibraries: libraryId} }
      );
    }
  },
  async unFavoriteLibrary(userId, libraryId) {
    userId = validation.checkValidId(userId);
    libraryId = validation.checkValidId(libraryId);

    // Check if library exists
    const libraryCollection = await libraries();
    const library = await libraryCollection.findOne(
        {_id: new ObjectId(libraryId)},
    );
    if (library === null) throw "Error: No library found with given ID.";

    // Add libraryId to user's favorited libraries
    const userCollection = await users();

    const user = userCollection.findOne({ _id: new ObjectId(userId) });
    if (user === null) throw "Error: No user found with given ID.";
    
    // If the user has already favorited this library
    if (user.favLibraries.includes(libraryId)) {
      await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: {favLibraries: libraryId} }
      );
    }
  },
  async getAllFavoritedLibraries(userId) {
    userId = validation.checkValidId(userId);

    // Returns only the array containing the user's favorited libraries
    const userCollection = await users();
    const favorites = await userCollection.findOne(
      {_id: new ObjectId(userId)},
      {projection: {_id: 0, favLibraries: 1}}
    );
    if (favorites === null) throw "Error: No user found with given ID.";
    return favorites;
  }
};

export default exportedMethods;