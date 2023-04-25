import {users} from '../config/mongoCollections.js';
import {libraries} from "../config/mongoCollections.js";
import {ObjectId} from 'mongodb';
import validation from '../public/js/validators/validation.js';
import libraryFunctions from './libraries.js';
import bcrypt from 'bcrypt';
import { validationsForCheckUser, validationsForCreateUser } from '../public/js/validators/user.js';

const usersCollection = await users();

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
    validationsForCreateUser(firstName.trim(), lastName.trim(), emailAddress.trim(), password, Number(age), userName);
  
    firstName = firstName.trim();
    lastName = lastName.trim();
    emailAddress = emailAddress.trim();
    emailAddress = emailAddress.toLowerCase();
  
    let userFromDB = await usersCollection.findOne({ emailAddress });
  
    if (userFromDB) throw "VError: User already exists with this email address";
  
    password = await bcrypt.hash(password, (await bcrypt.genSalt(10)));
  
    let newUser = { 
      firstName, 
      lastName, 
      emailAddress,
      password,
      age,
      userName,
      dateCreated: new Date().toLocaleDateString(),
      favLibraries: [],
      ownedLibraries: [] 
    };
  
    const { acknowledged, insertedId } = await usersCollection.insertOne(newUser);
  
    if (!acknowledged || !insertedId) throw "VError: Couldn't add user";
    return { insertedUser: true };
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
    
    let userFromDB = await usersCollection.findOne({ emailAddress });
  
    if (!userFromDB) throw "Either the email address or password is invalid";
  
    let { firstName, lastName, emailAddress: email, role } = userFromDB;
  
    let isValid = await bcrypt.compare(password, userFromDB.password);
  
    if (isValid) return { firstName, lastName, emailAddress: email, role };
    throw "Either the email address or password is invalid";
  }
};

export default exportedMethods;