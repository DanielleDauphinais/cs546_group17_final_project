/** @fileoverview This file contains data layer logic for authentication of users */

import { users } from '../config/mongoCollections.js';
import { validationsForSignUp, validationsForLogin } from '../public/js/validators/user.js';
import * as bcrypt from 'bcrypt';

/** 
 * A constant global variable which will be called only once
 * to get the userCollection and from there on you can just reuse the 
 * variable which will save a lot of time in every call since we cut
 * down one promise in our flow.
 */
const userCollection = await users();


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
*/
const create = async user => {
    validationsForSignUp(user);

    user.password = await bcrypt.hash(user.password, (await bcrypt.genSalt(10)));

    const { acknowledged, insertedId } = await userCollection.insertOne(user);

    if (!acknowledged || !insertedId) throw "VError: Couldn't add user";
};

/**
* This function will validate if the given user credentials are correct or not
* 
* @param {{
* 	email: String,
* 	password: String
* }} user 
* 
* @returns {Object}
*/
const validate = async user => {
    validationsForLogin(user);

    let userFromDb = await userCollection.findOne({ email: user.email });

    /** Eeven though we don't have a user under this email we shouldn't say user not found */
    if (!userFromDb) throw "VError: Invalid Credentials";

    let { password, ...rest } = userFromDb;

    return (await bcrypt.compare(user.password, password)) ? { ...rest, _id: rest._id.toString() } : null;
};

export {
    create,
    validate
};
