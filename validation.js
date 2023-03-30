const validationFunctions = {
    checkValidId(id, varName){
        if (!id) throw `Error: You must provide a ${varName}`;
        if (typeof id !== 'string') throw `Error: ${varName} must be a string`;
        id = id.trim();
        if (id.length === 0) throw `Error: ${varName} cannot be an empty string or just spaces`;
        if (!ObjectId.isValid(id)) throw `Error: ${varName} is not a valid object ID`;
        return id;
    },
    checkValidString(x, varName){
        if (!x) throw `Error: You must supply a ${varName}!`;
        if (typeof x !== 'string') throw `Error: ${varName} must be a string!`;
        x = x.trim();
        if (x.length === 0) throw `Error: ${varName} cannot be an empty string.`;
        if (!isNaN(x)) throw `Error: ${x} is not a valid value for ${varName} as it only contains digits`;
        return x;
    }
}

export default validationFunctions;