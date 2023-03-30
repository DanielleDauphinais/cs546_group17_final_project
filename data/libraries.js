import {libraries} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import validation from '../validation.js';

const get = async (id) => {
    // ejinks
    id = validation.checkValidId(id, "Library ID");
    const libraryCollection = await libraries();
    let library = await libraryCollection.findOne({_id: new ObjectId(id)});
    if (library === null) throw "Error: No library found with given ID.";
    library._id = library._id.toString();
    return library;
}

const getAllComments = async (id) => {
    // ejinks
    id = validation.checkValidId(id, "Library ID");
    const libraryCollection = await libraries();
    let commentsList = await libraryCollection.findOne(
        {_id: new ObjectId(id)},
        {_id: 0, comments: 1}
    );
    if (commentsList == null) throw "Error: No library found with given ID.";
    return commentsList;
}

export default {
    getAllComments
};