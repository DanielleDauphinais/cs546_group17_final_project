import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import validation from '../validation.js';
import { validationsForSignUp, validationsForLogin } from '../public/js/validators/user.js';
import * as bcrypt from 'bcrypt';

/** 
 * A constant global variable which will be called only once
 * to get the userCollection and from there on you can just reuse the 
 * variable which will save a lot of time in every call since we cut
 * down one promise in our flow.
 */
const userCollection = await users();

const getAllUsers = async () => {
	const userCollection = await users();
	const userList = await userCollection.find({}).toArray();
	return userList;
};

const getUserById = async (id) => {
	id = validation.checkValidId(id, "user_id");
	const userCollection = await users();
	const user = await userCollection.findOne({ _id: ObjectId(id) });
	if (!user) throw 'Error: User not found';
	return user;
}

/**
 * This function will hash the password and create a new user doc in db
 * 
 * @param {{ 
 * 	firstName: String, 
 * 	lastName: String, 
 * 	email: String, 
 * 	age: Number, 
 *  username: String, 
 *  password: String 
 * }} user 
 * 
 * @returns {String} id 
 */
const create = async user => {
	validationsForSignUp(user);

	user.password = await bcrypt.hash(user.password, (await bcrypt.genSalt(10)));

	const { acknowledged, insertedId } = await userCollection.insertOne(user);

	if (!acknowledged || !insertedId) throw "VError: Couldn't add user";
	return insertedId.toString();
};

/**
 * This function will validate if the given user credentials are correct or not
 * 
 * @param {{
 * 	email: String,
 * 	password: String
 * }} user 
 * 
 * @returns {Boolean}
 */
const valid = async user => {
	validationsForLogin(user);

	let userFromDb = await userCollection.findOne({ email });

	/** Eeven though we don't have a user under this email we shouldn't say user not found */
	if (!userFromDb) throw "VError: Invalid Credentials";
	return bcrypt.compare(user.password, userFromDb.password);
};

export {
	getAllUsers,
	getUserById,
	create,
	valid
};
