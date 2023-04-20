import {ObjectId} from 'mongodb';

const validationFunctions = {
    checkValidId(id, varName){
        if (!id) throw `Error: You must provide a ${varName}`;
        if (typeof id !== 'string') throw `Error: ${varName} must be a string`;
        id = id.trim();
        if (id.length === 0) throw `Error: ${varName} cannot be an empty string or just spaces`;
        if (!ObjectId.isValid(id)) throw `Error: ${varName} is not a valid object ID`;
        return id;
    },
    // Checks to make sure strVal is not an empty string and returns trimed string
    checkString(strVal, varName) {
      if (!strVal) throw `Error: You must supply a ${varName}!`;
      if (typeof strVal !== 'string') throw `Error: ${varName} must be a string!`;
      strVal = strVal.trim();
      if (strVal.length === 0)
        throw `Error: ${varName} cannot be an empty string or string with just spaces`;
      if (!isNaN(strVal))
        throw `Error: ${strVal} is not a valid value for ${varName} as it only contains digits`;
      return strVal;
    },
    // Checks to make sure val is a valid string
    isValidNumber(val, varName) {
      if(typeof val !== 'number' || isNaN(val)){
          throw `Error: ${varName || 'provided variable'} is not a number`;
      }
      return val;
    },
    checkStringArray(arr, varName) {
      //We will allow an empty array for this,
      //if it's not empty, we will make sure all tags are strings
      if (!arr || !Array.isArray(arr))
        throw `Error: You must provide an array of ${varName}`;
      for (let i in arr) {
        if (typeof arr[i] !== 'string' || arr[i].trim().length === 0) {
          throw `Error: One or more elements in ${varName} array is not a string or is an empty string`;
        }
        arr[i] = arr[i].trim();
      }
      return arr;
    },
    checkEmail(x){
      if (!x) throw "Error: Email address does not exist.";
      if (typeof x !== 'string') throw "Error: Email address is not a string";
      x = x.toLowerCase();
      // https://www.w3resource.com/javascript/form/email-validation.php
      if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(x))) throw "Error: Invalid email address.";
      return x;
    },
    checkName(x){
      if (!x) throw "Error: Name does not exist.";
      if (typeof x !== 'string') throw "Error: Name is not a string";
      x = x.trim();
      if (x.length === 0) throw "Error: Name is empty.";
      if (x.length < 2) throw "Error: Name must be at least 2 characters long.";
      if (x.length > 25) throw "Error: Name must be less than or equal to 25 characters long.";
      if (/\d/g.test(x)) throw "Error: Name cannot have numbers.";
      return x;
    },
    checkPassword(x){
      if (!x) throw "Error: Password does not exist.";
      if (typeof x !== 'string') throw "Error: Password is not a string";
      x = x.trim();
      if (x.length === 0) throw "Error: Password is empty.";
      if (x.length < 8) throw "Error: Password must be at least 8 characters long.";
      if (/\s/g.test(x)) throw "Error: Password cannot have empty spaces.";
      if (!(/\d/.test(x))) throw "Error: Password must have at least one number.";
      if (!(/[A-Z]/.test(x))) throw "Error: Password must have at least one uppercase character.";
      if (!(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(x))) throw "Error: Password must have at least one special character.";
      return x;
    }
}

export default validationFunctions;