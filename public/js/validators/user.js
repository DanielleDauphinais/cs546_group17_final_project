/** @fileoverview This file will contain all the required validations for signup and login */

import { validationsForStrings, isNumber } from "./util.js";

/**
 * This function will validate all the fields required for signup process
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
 */
const validationsForSignUp = user => {
    if (!user) throw "VError: Enter your details.";

    if (!user.firstName) throw "VError: firstName field is required";

    if (!user.lastName) throw "VError: lastName field is required";

    if (!user.email) throw "VError: email field is required";

    if (!user.age) throw "VError: age field is required";

    if (!user.username) throw "VError: username field is required";

    if (!user.password) throw "VError: password field is required";

    let { firstName, lastName, email, age, username, password } = user;

    validationsForStrings("firstName", firstName)
    validationsForStrings("lastName", lastName)
    validationsForStrings("email", email)
    validationsForStrings("username", username)
    validationsForStrings("password", password)

    /** 100 years is a reasonable maximum age for human I guess */
    if(!isNumber(age) || age < 13 || age > 100) throw "VError: age is not valid";
}

const validationsForLogin = user => {
    if (!user) throw "VError: Username and password are required";

    if (!user.email) throw "VError: email field is required";

    if (!user.password) throw "VError: password field is required";

    validationsForStrings("email", user.email)
    validationsForStrings("password", user.password)
}

export { validationsForSignUp, validationsForLogin };
