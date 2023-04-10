import {Router} from 'express';
const router = Router();
import {libraryData} from '../data/index.js';
import validation from '../validation.js';

router
  .route('/')
  .get(async (req, res) => { // Currently just sents json of all libraries
    try {
      const libraryList = await libraryData.getAllLibraries();
      res.json(libraryList);
    } catch (e) {
      res.status(500).json({error: e});
    }
  })
  .post(async (req, res) => { // Currently creates libary and sents json of created library
    const newLibraryData = req.body;
    if (!newLibraryData || Object.keys(newLibraryData).length === 0) {
      return res
        .status(400)
        .json({error: 'There are no fields in the request body'});
    }
    try { // NEED TO UNDATE FOR LOCATION AND IMAGE
      newLibraryData.name = validation.checkString(newLibraryData.name, 'Name');
      newLibraryData.ownerID = validation.checkId(newLibraryData.ownerID, "Library Owner ID");
      newLibraryData.fullnessRating  = validation.isValidNumber(newLibraryData.fullnessRating, "Fullness Rating");
      newLibraryData.genres = validation.checkStringArray(newLibraryData.genres, "Genres Available");
    } catch (e) {
      return res.status(400).json({error: e});
    }

    try {
      const {name, ownerID, fullnessRating, genres} = newLibraryData;
      const newLibrary = await libraryData.create(name, location, image, ownerID, fullnessRating,genres);
      res.json(newLibrary);
    } catch (e) {
      res.status(500).json({error: e});
    }
  });

router
  .route('/:id')
  .get(async (req, res) => {
    let id = req.params.id;
    
    id = validation.checkValidId(id);

    let library;

    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).send("Error: No library with given ID");
    }

    try {
      res.render('libraries/library', {title: library.name, library: library});
    } catch (e) {
      res.status(500).send(e);
    }
  })
  
export default router;
