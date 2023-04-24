import { libraries } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import validation from "../public/js/validators/validation.js";

const exportedMethods = {
  /** This function creates a library and adds it to the collection
   *  Return value: return the information of the library created
   */
  async create(
    name,
    location, // Vish will help!! possibly using the API?
    image, // Vish will help!!
    ownerID,
    fullnessRating,
    genres
  ) {
    name = validation.checkString(name, "Library Name");
    ownerID = validation.checkId(ownerID, "Library Owner ID");
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
    let newLibrary = {
      name: name,
      location: location,
      image: image,
      ownerID: ownerID,
      fullnessRating: fullnessRating,
      lastServayed: lastServayed,
      genres: genres,
      favorites: [],
      comments: [],
    };
    const librariesCollection = await libraries();
    const insertInfo = await librariesCollection.insertOne(newLibrary);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
      throw "Error: Could not add Library";
    }
    insertInfo.insertedId = insertInfo.insertedId.toString();
    let res = await this.getLibraryById(insertInfo["insertedId"].toString());
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
  async createComment(libraryId, userId, text) {
    // ejinks
    libraryId = validation.checkValidId(libraryId, "Library ID");
    userId = validation.checkValidId(userId, "User ID");

    text = validation.checkValidString(text, "Comment Body");

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
  async likeComment(userId, commentId) {
    // ejinks
    userId = validation.checkValidId(userId, "User ID");
    commentId = validation.checkValidId(commentId, "Comment ID");

    const libraryCollection = await libraries();
    const library = await libraryCollection.findOne(
      { "comments._id": new ObjectId(commentId) },
      { projection: { _id: 1 } }
    );
    if (library === null) throw "Error: No library found with given ID.";

    const libraryId = library._id;

    await libraryCollection.updateOne(
      { _id: libraryId },
      { $push: { "comments.likes": userId } }
    );
  },
  // getNumLikes
  // getNumFavorites
  // addLiketoComment
  // addLiketoLibrary

  /** This function gets an array of Libaries by ownerID*/
  async getLibrariesByOwnerID(ownerId) {
    ownerId = validation.checkId(ownerId);
    const librariesCollection = await libraries();
    return await librariesCollection.find({ ownerID: ownerId }).toArray();
  },
  /** This function will remove a library if the userId is equal to the ownerID*/
  async removeLibrary(libraryId, userId) {
    libraryId = validation.checkId(libraryId);
    userId = validation.checkId(userId);
    const libary = getLibraryById(libraryId); // This is misspelt. Did you mean this?
    if (userId === libary.ownerID) {
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
  /**
   * jcarr2
   * @name formUpdate
   * @param {String} libraryId - The ID of the library to change
   * @param {Number} fullnessRating
   * @param {Array<String>} genres
   * @returns {Object} The updated object of the library
   */
  async formUpdate(libraryId, fullnessRating, genres) {
    // Input checking - Maybe consider changing the name of isValidNumber to checkNumber to be uniform?
    libraryId = validation.checkId(libraryId);
    fullnessRating = validation.isValidNumber(fullnessRating);
    genres = validation.checkStringArray(genres);
    // The actual update
    let formData = {
      fullnessRating: fullnessRating,
      genres: genres,
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
