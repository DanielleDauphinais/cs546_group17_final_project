import { libraries } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import validation from "../public/js/validators/validation.js";
import { checkImageFileString } from "../public/js/validators/util.js";
import userFunctions from "./users.js";
import fs from "fs";

let exportedMethods = {
  /** This function creates a library and adds it to the collection
   *  Return value: return the information of the library created
   */
  async create(
    name,
    coordinates,
    address,
    image,
    ownerID,
    fullnessRating,
    genres
  ) {
    let currentDate, lastServayed;
    try {
      // All these tests should result in rerendering the page so if there is an error it should start with a V
      name = validation.checkString(name, "Library Name");
      ownerID = validation.checkValidId(ownerID, "Library Owner ID");
      fullnessRating = validation.isValidNumber(fullnessRating, "Fullness Rating");
      genres = validation.checkStringArray(genres, "Genres Available");
      currentDate = new Date();
      lastServayed = currentDate.toLocaleString(undefined, {
        // should be in form "7/22/2016, 04:21 AM"
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      checkImageFileString(image, "Image input")
    } catch (e) {
      throw "V" + e;
    }
    let newLibrary = {
      name: name,
      coordinates: coordinates,
      address: address,
      image: image,
      ownerID: ownerID,
      fullnessRating: fullnessRating,
      lastServayed: lastServayed,
      genres: genres,
      favorites: [],
      comments: [],
    };
    const librariesCollection = await libraries();
    const currentList = await this.getAllLibraries();
    currentList.forEach(x =>  {
      if (x.name.toLowerCase() === name.toLowerCase()) throw "VError: There already exists a library with the given name."
    })
    const lib = await librariesCollection.findOne({ address: address }); 
    if (lib !== null)
      throw "VError: There already exists a library at the given address.";
    const insertInfo = await librariesCollection.insertOne(newLibrary);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
      throw "Error: Could not add Library";
    }
    insertInfo.insertedId = insertInfo.insertedId.toString();
    userFunctions.addOwnedLibrary(ownerID, insertInfo["insertedId"].toString());
    let res = await this.get(insertInfo["insertedId"].toString());
    return res;
  },
  /** This function gets all the libraries and returns the json data in an array*/
  async getAllLibraries() {
    const librariesCollection = await libraries();
    let libs = await librariesCollection.find({}).toArray();
    return libs.map((lib) => {
      lib._id = lib._id.toString();
      return lib;
    });
  },
  async get(id) {
    // ejinks - reconfiged to export all
    id = validation.checkValidId(id, "Library ID");
    const libraryCollection = await libraries();
    let library = await libraryCollection.findOne({ _id: new ObjectId(id) });
    if (library === null) throw "Error: No library found with given ID.";
    library._id = library._id.toString();
    return library;
  },
  async getLibraryByName(name) {
    name = validation.checkString(name);
    const librariesCollection = await libraries();
    const lib = await librariesCollection.findOne({ name: name });
    if (!lib) throw "VError: There is no libraries with the given name";
    lib._id = lib._id.toString();
    return lib;
  },
  /**
   * @name editLibrary
   * @author Mostly ejinks code, re-used and edited by jcarr2
   * @param {String} libraryID
   * @param {String} name
   * @param {[Number, Number]} coordinates
   * @param {String} address
   * @param {String} image
   * @param {String} ownerID
   * @param {Number} fullnessRating
   * @param {Array<String>} genres
   * @returns {Object}
   */
  async editLibrary(
    libraryId,
    name,
    coordinates,
    address,
    image,
    ownerID,
    fullnessRating,
    genres
  ) {
    /* Pretty much just use the validation code form Create */
    libraryId = validation.checkValidId(libraryId, "Library ID");
    name = validation.checkString(name, "Library Name");
    ownerID = validation.checkValidId(ownerID, "Library Owner ID");
    fullnessRating = validation.isValidNumber(
      fullnessRating,
      "Fullness Rating"
    );
    genres = validation.checkStringArray(genres, "Genres Available");
    const currentDate = new Date();
    const lastServayed = currentDate.toLocaleString(undefined, {
      // should be in form "7/22/2016, 04:21 AM"
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    try {
      checkImageFileString(image, "Image input");
    } catch (e) {
      throw "V" + e;
    }
    let editedLibrary = {
      name: name,
      coordinates: coordinates,
      address: address,
      image: image,
      fullnessRating: fullnessRating,
      lastServayed: lastServayed,
      genres: genres,
    };
    /* Pretty much the same code from the FormUpdate */
    const librariesCollection = await libraries();
    const currentList = await this.getAllLibraries();
    currentList.forEach(x =>  {
      if (x.name.toLowerCase() === name.toLowerCase()) throw "VError: There already exists a library with the given name."
    })
    let library = await librariesCollection.findOne({ _id: new ObjectId(libraryId) });
    if (library === null) throw "Error: No library found with given ID.";
    if (library.ownerID !== ownerID)
      throw "Error: User is not the library's owner.";
    let same = true
    for (const key in editedLibrary) {
      if (key!== "lastServayed" && key!== "coordinates" && key !== "genres" && editedLibrary[key] !== library[key]) {
        same = false;
      }
      if((key === "coordinates" || key === "genres") && JSON.stringify(editedLibrary[key]) != JSON.stringify(library[key])) {
        same = false;
      }
    }
      
    if (same) throw "VError: No changes have been made.";

    const updateInfo = await librariesCollection.findOneAndUpdate(
      { _id: new ObjectId(libraryId) },
      { $set: editedLibrary },
      { returnDocument: "after" }
    );
    if (updateInfo.lastErrorObject.n === 0) {
      throw `Error: Could not update library with id of ${libraryId}`;
    }
    updateInfo.value._id = updateInfo.value._id.toString();
    return updateInfo.value;
  },
  /** This function will remove a library if the userId is equal to the ownerId*/
  async removeLibrary(libraryId, userId) {
    libraryId = validation.checkValidId(libraryId);
    userId = validation.checkValidId(userId);
    const librariesCollection = await libraries();
    let library = await librariesCollection.findOne({
      _id: new ObjectId(libraryId),
    });
    try {
      for (let i = 0; i < library.favorites.length; i++) {
        await userFunctions.favoriteLibrary(library.favorites[i], libraryId)
      }
    } catch (e) {
      throw `Error: Could not delete library with id of ${libraryId}`;
    }
    fs.unlink(library.image, () => {})
    if (userId === library.ownerID) {
      const deletionInfo = await librariesCollection.findOneAndDelete({
        _id: new ObjectId(libraryId),
      });
      if (deletionInfo.lastErrorObject.n === 0)
        throw `Error: Could not delete library with id of ${libraryId}`;
      await userFunctions.dropOwnedLibrary(userId, libraryId);
      return { ...deletionInfo.value, deleted: true };
    } else {
      throw `Error: Could not delete library with id of ${libraryId}`;
    }
  },
  async getAllComments(id) {
    // ejinks
    id = validation.checkValidId(id, "Library ID");
    const libraryCollection = await libraries();
    let commentsList = await libraryCollection.findOne(
      { _id: new ObjectId(id) },
      { _id: 0, comments: 1 }
    );
    if (commentsList === null) throw "Error: No library found with given ID.";
    return commentsList;
  },
  async getComment(commentId) {
    commentId = validation.checkValidId(commentId, "Comment ID");

    const libraryCollection = await libraries();

    let library = await libraryCollection.findOne(
      { "comments._id": new ObjectId(commentId) },
      { projection: { _id: 0, "comments.$": 1 } }
    );
    if (library === null) throw "Error: No library found with given ID.";

    let comment = library.comments[0];
    comment._id = comment._id.toString();
    return comment;
  },
  async createComment(libraryId, userId, userName, text) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    userName = validation.checkString(userName, "Username");

    text = validation.checkString(text, "Comment Body");

    let newComment = {
      _id: new ObjectId(),
      userId: userId,
      userName: userName,
      dateCreated: new Date().toLocaleString(),
      text: text,
      likes: [],
    };

    const libraryCollection = await libraries();
    await libraryCollection.updateOne(
      { _id: new ObjectId(libraryId) },
      { $push: { comments: newComment } }
    );

    newComment._id = newComment._id.toString();
    return newComment;
  },
  async editComment(userId, commentId, text) {
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Commment ID");

    text = validation.checkString(text, "Update Comment Body");

    const originalComment = await this.getComment(commentId);

    if (userId !== originalComment.userId)
      throw "Error: User does not have permission to edit this comment";

    let updateComment = {
      _id: new ObjectId(originalComment._id),
      userId: originalComment.userId,
      userName: originalComment.userName,
      dateCreated: new Date().toLocaleString(),
      text: text,
      likes: originalComment.likes,
    };

    const libraryCollection = await libraries();
    const updateInfo = await libraryCollection.findOneAndUpdate(
      { "comments._id": new ObjectId(commentId) },
      { $set: { "comments.$": updateComment } },
      { returnDocument: "after" }
    );

    if (updateInfo.lastErrorObject.n === 0)
      throw "Error: Comment update failed";
    let comment = updateInfo.value.comments[0];
    comment._id = comment._id.toString();
    return comment;
  },
  async deleteComment(libraryId, userId, commentId) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Comment ID");

    const originalComment = await this.getComment(commentId);
    const library = await this.get(libraryId);
    if (userId !== originalComment.userId && userId !== library.ownerID)
      throw "Error: User does not have permission to delete this comment";

    const libraryCollection = await libraries();
    await libraryCollection.updateOne(
      { _id: new ObjectId(libraryId) },
      { $pull: { comments: { _id: new ObjectId(originalComment._id) } } }
    );
  },
  async likeComment(libraryId, userId, commentId) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Comment ID");

    const originalComment = await this.getComment(commentId);
    if (userId === originalComment.userId)
      throw "Error: User does not have permission to like this comment.";

    const libraryCollection = await libraries();
    let updateInfo;
    if (originalComment.likes.includes(userId)) {
      updateInfo = await libraryCollection.findOneAndUpdate(
        {
          _id: new ObjectId(libraryId),
          "comments._id": new ObjectId(commentId),
        },
        { $pull: { "comments.$.likes": userId } },
        { returnDocument: "after" }
      );
    } else {
      updateInfo = await libraryCollection.findOneAndUpdate(
        {
          _id: new ObjectId(libraryId),
          "comments._id": new ObjectId(commentId),
        },
        { $push: { "comments.$.likes": userId } },
        { returnDocument: "after" }
      );
    }

    if (updateInfo.lastErrorObject.n === 0) throw "Error: Like failed";

    return updateInfo.value;
  },
  /** This function gets an array of Libaries by ownerID*/
  async getLibrariesByOwnerID(ownerId) {
    ownerId = validation.checkId(ownerId);
    const librariesCollection = await libraries();
    return await librariesCollection.find({ ownerId: ownerId }).toArray();
  },
  /**
   * @name formUpdate
   * @author jcarr2
   * @param {String} libraryId - The ID of the library to change
   * @param {Number} fullnessRating
   * @param {Array<String>} genres
   * @returns {{id: String, name: String, coordinates: [Number, Number], image: String, ownerId: string,
   *  fullnessRating: number, lastServayed: string, genres: Array<String>, favorites: Array, comments: Array}} The updated object of the library
   */
  async formUpdate(libraryId, fullnessRating, genres) {
    // Input checking - Maybe consider changing the name of isValidNumber to checkNumber to be uniform?
    libraryId = validation.checkValidId(libraryId);
    fullnessRating = validation.isValidNumber(fullnessRating);
    genres = validation.checkStringArray(genres);

    // Input validation
    if (fullnessRating < 0 || fullnessRating > 5) {
      throw "Error: Improper Range on Fullness!";
    }

    // List of Genre Strings
    let genresStrings = [
      "pictureBooks",
      "youngAdultFiction",
      "fantasyFiction",
      "fairyTale",
      "boardBook",
      "nonFiction",
      "mystery",
      "graphicNovel",
      "chapterBooks",
    ];

    // Check that each non-undefined value is a valid genre in proper format (camelcase).
    genres.forEach((gen) => {
      if (!genresStrings.includes(gen)) {
        throw "Error: Invalid genre string data!";
      }
    });

    // Remove duplicates (Using set inherent properties to remove duplicates).
    genres = [...new Set(genres)];

    // Genre Library Check
    if (genres.length === 0 && fullnessRating !== 0) {
      throw "Error: You must specify at least one genre for a non-empty library!";
    }
    if (genres.length > 0 && fullnessRating === 0) {
      throw "Error: An empty library cannot have any genres specified!";
    }

    // The actual update
    const currentDate = new Date();
    const lastServayed = currentDate.toLocaleString(undefined, {
      // should be in form "7/22/2016, 04:21 AM"
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    let formData = {
      fullnessRating: fullnessRating,
      genres: genres,
      lastServayed: lastServayed,
    };
    const librariesCollection = await libraries();
    const updateInfo = await librariesCollection.findOneAndUpdate(
      { _id: new ObjectId(libraryId) },
      { $set: formData },
      { returnDocument: "after" }
    );
    if (updateInfo.lastErrorObject.n === 0) {
      throw `Error: Could not update library with id of ${libraryId}`;
    }
    updateInfo.value._id = updateInfo.value._id.toString();
    return updateInfo.value;
  }
};

export default exportedMethods;
