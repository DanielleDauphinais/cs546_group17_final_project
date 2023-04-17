const isJustAString = (e) => (typeof e === "string");

const isJustEmptySpaces = (e) => e.trim().length === 0;

const validationsForStrings = (name, value, allowEmptyStrings = false) => {
	if (!value) throw `VError: ${name} parameter should exist`;

	if (!isJustAString(value)) throw `VError: ${name} parameter should be a string`;

	if (isJustEmptySpaces(value) && !allowEmptyStrings) throw `VError: ${name} parameter cannot be just an empty string or just whitespaces`;
}

const validationsForObjectId = (name, value, allowEmptyStrings = false) => {
	validationsForStrings(name, value, allowEmptyStrings);

	if (!ObjectId.isValid(value.trim())) throw `VError: ${name} is not valid`;
};

const isValidString = (e) => isJustAString(e) && !isJustEmptySpaces(e);

const isNumber = (e) => (typeof e === "number") && (!isNaN(e));

export {
    isJustAString,
    isJustEmptySpaces,
    validationsForStrings,
    validationsForObjectId,
    isValidString,
    isNumber
};
