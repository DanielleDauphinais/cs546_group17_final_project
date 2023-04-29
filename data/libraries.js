import { libraries } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import validation from "../public/js/validators/validation.js";
import userFunctions from "./users.js";

let exportedMethods = {
  /** This function creates a library and adds it to the collection
   *  Return value: return the information of the library created
   */
  async create(
    name,
    coordinates,
    image, // Vish will help!!
    ownerID,
    fullnessRating,
    genres
  ) {
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
    // TODO: ADD "path": "public/uploads/1681934019520.png", information
    // TODO: ADD Stuff to check city using Google maps API using lat, lng,
    let newLibrary = {
      name: name,
      coordinates: coordinates,
      image: image,
      ownerID: ownerID,
      fullnessRating: fullnessRating,
      lastServayed: lastServayed,
      genres: genres,
      favorites: [],
      comments: [],
    };
    const librariesCollection = await libraries();
    const lib = await librariesCollection.findOne({ name: name });
    if (lib !== null)
      throw "VError: There already exists a library with the given name";
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
    return await librariesCollection.find({}).toArray();
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
    return lib;
  },
  /**
   * @name editLibrary
   * @author Mostly ejinks code, re-used and edited by jcarr2
   * @param {String} libraryID
   * @param {String} name
   * @param {[Number, Number]} coordinates
   * @param {String} image
   * @param {Number} fullnessRating
   * @param {Array<String>} genres
   * @returns {{id: String, name: String, coordinates: [Number, Number], image: String, ownerId: string,
   *  fullnessRating: number, lastServayed: string, genres: Array<String>, favorites: Array, comments: Array}}
   */
  async editLibrary(
    libraryId,
    name,
    coordinates,
    image,
    fullnessRating,
    genres
  ) {
    /* Pretty much just use the validation code form Create */
    libraryId = validation.checkValidId(libraryId, "Library ID");
    name = validation.checkString(name, "Library Name");
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
    // TODO: ADD "path": "public/uploads/1681934019520.png", information
    // TODO: ADD Stuff to check city using Google maps API using lat, lng,
    let editedLibrary = {
      name: name,
      coordinates: coordinates,
      image: image,
      fullnessRating: fullnessRating,
      lastServayed: lastServayed,
      genres: genres,
    };
    /* Pretty much the same code from the FormUpdate */
    const librariesCollection = await libraries();
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
    const libary = getLibraryById(libraryId); // This is misspelt. Did you mean this?
    if (userId === libary.ownerId) {
      const librariesCollection = await libraries();
      const deletionInfo = await librariesCollection.findOneAndDelete({
        _id: ObjectId(libraryId),
      });
      if (deletionInfo.lastErrorObject.n === 0)
        throw `Error: Could not delete post with id of ${libraryId}`; // Not sure if you meant to keep the word post here
      return { ...deletionInfo.value, deleted: true };
    } else {
      throw `Error: Could not delete post with id of ${libraryId}`;
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
  async getComment(libraryId, commentId) {
    libraryId = validation.checkValidId(libraryId);
    commentId = validation.checkValidId(commentId);

    const libraryCollection = await libraries();
    let commentsList = await libraryCollection.findOne(
      { _id: new ObjectId(id) },
      { _id: 0, comments: 1 }
    );
    if (commentsList === null) throw "Error: No library found with given ID.";

    commentsList.forEach((x) => {
      if (x._id.toString() === commentId) {
        return x;
      }
    });
    throw "Error: No comment found with given comment ID in given library.";
  },
  async createComment(libraryId, userId, text) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");

    text = validation.checkString(text, "Comment Body");

    let newComment = {
      _id: new ObjectId(),
      userId: userId,
      dateCreated: new Date().toLocaleDateString(),
      text: text,
      likes: [],
    };

    const libraryCollection = await libraries();
    await libraryCollection.updateOne(
      { _id: new ObjectId(libraryId) },
      { $push: { comments: newComment } }
    );
  },
  async editComment(libraryId, userId, commentId, text) {
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Commment ID");

    text = validation.checkString(text, "Update Comment Body");

    const originalComment = this.getComment(libraryId, commentId);
    if (userId !== originalComment.userId)
      throw "Error: User does not have permission to edit this comment";

    let updateComment = {
      dateCreated: new Date().toLocaleDateString(),
      text: text,
    };

    const libraryCollection = await libraries();
    const updateInfo = await libraryCollection.findOneAndUpdate(
      { _id: new ObjectId(libraryId), "comments._id": new ObjectId(commentId) },
      { $set: { "comments.$": updateComment } },
      { returnDocument: "after" }
    );

    if (updateInfo.lastErrorObject.n === 0)
      throw "Error: Comment update failed";

    return updateInfo.value;
  },
  async deleteComment(libraryId, userId, commentId) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Comment ID");

    text = validation.checkString(text, "Comment Body");

    const originalComment = this.getComment(libraryId, commentId);
    const library = this.get(libraryId);
    if (userId !== originalComment.userId && userId !== library.ownerId)
      throw "Error: User does not have permission to delete this comment";

    const libraryCollection = await libraries();
    await libraryCollection.updateOne(
      { _id: new ObjectId(libraryId) },
      { $pull: { comments: originalComment } }
    );
  },
  async likeComment(libraryId, userId, commentId) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Comment ID");

    const originalComment = this.getComment(libraryId, commentId);
    if (userId === originalComment.userId)
      throw "Error: User does not have permission to like this comment.";

    if (originalComment.likes.includes(userId))
      throw "Error: User has already liked this comment.";

    const libraryCollection = await libraries();
    const updateInfo = await libraryCollection.findOneAndUpdate(
      { _id: new ObjectId(libraryId), "comments._id": new ObjectId(commentId) },
      { $push: { "comments.$.likes": userId } },
      { returnDocument: "after" }
    );

    if (updateInfo.lastErrorObject.n === 0) throw "Error: Like failed";

    return updateInfo.value;
  },
  async unLikeComment(libraryId, userId, commentId) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Comment ID");

    const originalComment = this.getComment(libraryId, commentId);
    if (userId === originalComment.userId)
      throw "Error: User does not have permission to like this comment.";

    if (!originalComment.likes.includes(userId))
      throw "Error: User has not liked this comment.";

    const libraryCollection = await libraries();
    const updateInfo = await libraryCollection.findOneAndUpdate(
      { _id: new ObjectId(libraryId), "comments._id": new ObjectId(commentId) },
      { $pull: { "comments.$.likes": userId } },
      { returnDocument: "after" }
    );

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
  },
};

export default exportedMethods;
