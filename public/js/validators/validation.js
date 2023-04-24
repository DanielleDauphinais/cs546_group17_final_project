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
      checkImageFileString(str, strName){
        str = this.checkString(str, strName);
        str = str.toLowerCase();
        let myArray = str.split(".");
        if(myArray.length != 2){
          throw `Error: ${strName} is not of the correct form.`
        }
        console.log(myArray)
        if(myArray[1]!== "jpeg" && myArray[1]!== "jpg" && myArray[1]!== "png" && myArray[1]!== "pdf"){
          throw `Error: ${strName} must have the extention .jpeg, .jpg, .png or .pdf`
        }
      }
}

export default validationFunctions;