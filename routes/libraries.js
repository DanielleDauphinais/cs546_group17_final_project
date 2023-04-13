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
  .post(async (req, res) => { // TODO: Will need to edit for location and new servay
    const newLibraryData = req.body;
    let errors = [];
    // TODO: NEED TO UNDATE FOR LOCATION AND IMAGE
    try {
      newLibraryData.name = validation.checkString(newLibraryData.name, 'Name');
    } catch (e) {
      errors.push(e)
    }
    try {
      newLibraryData.ownerID = validation.checkId(newLibraryData.ownerID, "Library Owner ID");
    } catch (e) {
      errors.push(e)
    }
    try { // TODO: THIS WILL BE UPDATED BECAUSE THE WAY OF SERVY CHANGING
      newLibraryData.fullnessRating  = validation.isValidNumber(newLibraryData.fullnessRating, "Fullness Rating");
    } catch (e) {
      errors.push(e)
    }
    try { // TODO:THIS WILL BE UPDATED BECAUSE THE WAY OF SERVY CHANGING
      newLibraryData.genres = validation.checkStringArray(newLibraryData.genres, "Genres Available");
    } catch (e) {
      errors.push(e)
    }
    if (errors.length > 0) {
      res.render('libraries/new', {
        errors: errors,
        hasErrors: true,
        library: newLibraryData,
        title: "Creating a Library", 
        id: "NEED TO FIX"
      });
      return;
    }
    try {
      const {name, ownerID, fullnessRating, genres} = newLibraryData;
      const newLibrary = await libraryData.create(name, location, image, ownerID, fullnessRating,genres);
      res.json(newLibrary); // TODO: will probably be to the library's page
    } catch (e) {
      res.status(500).render({errorCode:500, title:"error", id: "NEED TO FIX"});
    }
  });

router
  .route('/new')
  .get(async (req, res) => {
    // need to come back and fix the ID with cookie stuff
    res.render('libraries/new', {title: "Creating a Library", id: "NEED TO FIX"});
  });
router
  .route('/:id')
  
export default router;
