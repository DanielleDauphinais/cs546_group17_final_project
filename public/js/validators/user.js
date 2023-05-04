/** @fileoverview This file will contain all the required validations for signup and login */
import { validationsForStrings, isEmail, hasNumbers, isNumber } from "./util.js";

/**
 * This is the validation function for create user
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} emailAddress 
 * @param {string} password 
 * @param {Number} age
 * @param {string} userName
 */
const validationsForCreateUser = (firstName, lastName, emailAddress, password, age, userName) => {
    validationsForStrings("firstName", firstName, false, { min: 2, max: 25 });

    if (hasNumbers(firstName)) throw "VError: firstName cannot contain numbers";

    validationsForStrings("lastName", lastName, false, { min: 2, max: 25 });

    if (hasNumbers(lastName)) throw "VError: lastName cannot contain numbers";

    validationsForStrings("emailAddress", emailAddress, false);

    if (!isEmail(emailAddress)) throw "VError: emailAddress is invalid";

    /** 100 years is a reasonable maximum age for human I guess */
    if(!isNumber(age) || age < 13 || age > 100) throw "VError: Age is not valid";

    validationsForStrings("userName", userName, false);

    validationsForStrings("password", password, false, { min: 8, max: Infinity });

    if (password.includes(" ")) throw "VError: Password must not contain any spaces.";

    if (password.toLowerCase() === password) throw "VError: At least one letter should be capital";

    let specialCharsRegex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    let numbersRegex = /[0-9]/;

    if (!password.match(numbersRegex)) throw "VError: Password must contain at least one number";

    if (!password.match(specialCharsRegex)) throw "VError: Password must contain at least one special char";
};

/**
 * This is the validation function for login / check user
 * @param {string} emailAddress 
 * @param {string} password 
 */
const validationsForCheckUser = (emailAddress, password) => {
    validationsForStrings("emailAddress", emailAddress, false);

    if (!isEmail(emailAddress)) throw "VError: emailAddress is invalid";
    
    validationsForStrings("password", password, false, { min: 8, max: Infinity });

    if (password.includes(" ")) throw "VError: Password must not contain any spaces.";

    if (password.toLowerCase() === password) throw "VError: Atleast one letter should be capital";

    let specialCharsRegex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    let numbersRegex = /[0-9]/;

    if (!password.match(numbersRegex)) throw "VError: Password must contain atleast one number";

    if (!password.match(specialCharsRegex)) throw "VError: Password must contain atleast one special char";
};

export { validationsForCreateUser, validationsForCheckUser };
