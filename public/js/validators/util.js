const isJustAString = (e) => (typeof e === "string");

const isJustEmptySpaces = (e) => e.trim().length === 0;

const isEmail = (email) => {
    let emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return email.match(emailRegex);
}

const validationsForStrings = (name, value, allowEmptyStrings = false, lengthValidations = null) => {
    if (!value) throw `VError: ${name} parameter should exist`;

    if (!isJustAString(value)) throw `VError: ${name} parameter should be a string`;

    if (isJustEmptySpaces(value) && !allowEmptyStrings) throw `VError: ${name} parameter cannot be just an empty string or just whitespaces`;

    if (lengthValidations) {
        let { min, max } = lengthValidations;
        let len = value.length;

        if (len < min) throw `VError: ${name} should be atleast ${min} letters long.`;

        if ((len > max) && (max != Infinity)) throw `VError: ${name} should be atmost ${max} letters long.`;
    }
}

const isValidString = (e) => isJustAString(e) && !isJustEmptySpaces(e);

const isNumber = (e) => (typeof e === "number") && (!isNaN(e));

const isCharUpperCase = (c) => ((c.charCodeAt(0) >= 65) && (c.charCodeAt(0) <= 90));

const isCharNumber = (c) => ((c.charCodeAt(0) >= 48) && (c.charCodeAt(0) <= 57));

const hasNumbers = (s) => s.match(/[0-9]+/);

export {
    isJustAString,
    isJustEmptySpaces,
    isEmail,
    validationsForStrings,
    isValidString,
    isNumber,
    isCharUpperCase,
    isCharNumber,
    hasNumbers
};
