import { Router } from "express";
const router = Router();
import { libraryData } from "../data/index.js";
import validation from "../public/js/validators/validation.js";
import {checkImageFileString} from "../public/js/validators/util.js";
import multer from "multer";
import axios from 'axios';
import xss from 'xss';
import fs from "fs";



const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
      let extension = file.originalname.split('.')[1];
      if (!extension) extension = "";
      else extension = "." + extension;
      
      return cb(null, `${Date.now()}${extension}`);
  }
});

const upload = multer({ storage });

router.route('/')
  .get(async (req, res) => {
    try {
      let libraries = await libraryData.getAllLibraries();
      res.send(libraries);
    } catch (e) {
      res.status(500).render('error', {errorCode: 500});
    }
  });

router.route('/new')
  .get(async (req, res) => {
    try {
      res.render("libraries/new", { title: "Creating a Library", id: "NEED TO FIX" });
    } catch (error) {
      // need to cause an error page renderd
    }
    
  })
  .post(upload.single('image'), 
  async (req, res) => { // Currently creates libary and sends json of created library
    if(!req.file){ // Something went wrong saving the image
      // TODO: make it rerender!!!
      return res.status(500).send({ status: "Error", message: "Uh, Oh! Something wrong went on our side, we will fix it soon!" });
    }
    const newLibraryData = req.body;
    let errors = [];
    try {
      newLibraryData.name = validation.checkString(
        newLibraryData.name,
        "Name"
      );
    } catch (e) {
      errors.push(e);
    }
    try {
      newLibraryData.lat = Number(newLibraryData.lat);
      newLibraryData.lat = validation.isValidNumber(
        newLibraryData.lat,
        "Librarys Latitude"
      );
    } catch (error) {
      errors.push(e);
    }
    try {
      newLibraryData.lng = Number(newLibraryData.lng);
      newLibraryData.lng = validation.isValidNumber(
        newLibraryData.lng,
        "Librarys Longitude"
      );
    } catch (error) {
      errors.push(e);
    }
    try {
      req.session.user._id= validation.checkValidId(
        req.session.user._id,
        "Library Owner ID"
      );
    } catch (e) {
      errors.push(e);
    }
    // Getting the address of the library
    let data = '' 
    let city = ''
    let address = ''
    try{
      data = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLibraryData.lat},${newLibraryData.lng}&key=AIzaSyAPxSPvWssw3gI4W1qJaFk9xlBqBicI3iY`);
      city = data.data.results[0].address_components[2].long_name
      address = data.data.results[1].formatted_address
      console.log(city)
      console.log(address)
    }
    catch(e){
      return res.status(400).render('error', {errorNum: 400, searchValue: "Error on our side getting address data ", title: "Error"})
    }
    if(city !== "Hoboken") {
      newLibraryData.lat = ''
      newLibraryData.lng = ''
      errors.push("The location of the little free library must be in Hoboken");
    }
    if(address === ''){
      // TODO: what should this error be???
      return res.status(400).render('error', {errorNum: 400, searchValue: "Error on our side getting address data ", title: "Error"})
    }
    // TODO: data from Juilien
    // Grab all of the inputs from the request body.
    let genresInput = [
      newLibraryData.pictureBooks,
      newLibraryData.youngAdultFiction,
      newLibraryData.fantasyFiction,
      newLibraryData.fairyTale,
      newLibraryData.boardBook,
      newLibraryData.nonFiction,
      newLibraryData.mystery,
      newLibraryData.graphicNovel,
      newLibraryData.chapterBooks,
    ];

    // For every value, if it does not exist, then the checkbox was not selected.
    genresInput = genresInput.filter((genre) => {
      return typeof genre === "string";
    });

    try {
      newLibraryData.fullness = validation.isValidNumber(
        parseInt(newLibraryData.fullness),
        "Fullness Rating"
      );
      if (0 > newLibraryData.fullness || newLibraryData.fullness > 5) {
        errors.push("Fullness rating must be between 0-5");
      }
      genresInput = validation.checkStringArray(
        genresInput,
        "Genres Available"
      );
      if (genresInput.length === 0 && newLibraryData.fullness !== 0) {
        errors.push("Must specify at least one genre for a non-empty library.");
      }

    } catch (e) {
      // TODO: Why is this the error type
      return res
        .status(500)
        .render("error", { errorCode: 500, title: "Error Page" });
    }
    try {
      checkImageFileString(req.file.path, "Image upload")
    } catch (e) {
      // This can be used to remove file from data
      fs.unlink(req.file.path, (err) => {
        if (err) {
          return res
            .status(500)
            .render("error", { errorCode: 500, title: "Error Page" });
        }})
      errors.push(e)
    }

    if (errors.length > 0) {
      res.render("libraries/new", {
        errors: errors,
        hasErrors: true,
        library: newLibraryData,
        title: "Creating a Library",
        id: req.session.user._id,
      });
      return;
    }

    try {
      const { name, lat, lng, image, fullness } = newLibraryData;
      if (!process.env.DOMAIN) throw "Error: Env file not provided.";
      const newLibrary = await libraryData.create(
        newLibraryData.name,
        [newLibraryData.lat, newLibraryData.lng],
        address,
        process.env.DOMAIN+req.file.path,
        req.session.user._id,
        newLibraryData.fullness,
        genres // TODO:Need to be updated
      );
      res.json(newLibrary); // TODO: will probably be to the library's page
    } catch (e) {
      console.log(e)
      res
        .status(500)
        .render({ errorCode: 500, title: "error", id: "NEED TO FIX" });
    }
  });

router.route('/:id')
  .get(async (req, res) => {
    let id;
    
    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render('error', {errorCode: 400, searchValue: "Library"});
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: 404, searchValue: "Library"});
    }

    try {
      res.render('libraries/library', { title: library.name, library: library, isLoggedIn: true, script_partial: 'comment', userid: req.session.user._id});
    } catch (e) {
      res.status(500).render('error', {errorCode: 500});
    }
  })
  .post(async (req, res) => {
    // Allows a user to favorite/unfavorite a library
  })
  .put(async (req, res) => {
    // Allows a user to edit their library
  })
  .delete(async (req, res) => {
    // Allows a user to delete their library
  });

router.route('/:id/survey')
  .get(async (req, res) => {
    // Renders the survey page to rate fullness and input genres

    let id;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render('error', {errorCode: 400, searchValue: "Library"});
    }

    try {
      res.render('libraries/fullness', { id: id });
    } catch (e) {
      res.status(500).render('error', {errorCode: 500});
    }
  })
  .post(async (req, res) => {
    // Posts the users survey form submission

    let id;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render('error', {errorCode: 400, searchValue: "Library"});
    }

    // Grab the form data
    let updateData = req.body;
    // Using the similar data checking function as above. Maybe this should be made into a checker function?
    if (!updateData || Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ error: "There are no fields in the request body" });
    }
    /**
     * Assumed Form data is of type:
     * {
     *  fullnessRating: number
     *  genres: [array<string>]
     * }
     * This is using the error checking from before, using the helper functions for uniformity.
     */
    try {
      updateData.fullness = validation.isValidNumber(
        updateData.fullness,
        "Fullness Rating"
      );
      updateData.genres = validation.checkStringArray(
        updateData.genres,
        "Genres Available"
      );
    } catch (e) {
      return res.status(400).json({ error: e });
    }
    // At this point, assume the form data is completely valid.
    try {
      const { fullness, genres } = updateData;
      const updatedLibrary = await libraryData.formUpdate(
        libraryId,
        fullness,
        genres
      );
      res.json(updatedLibrary);
    } catch (e) {
      res.status(500).render('error', {errorCode: 500, title: "Error Page"});
    }
  });

router.route('/:id/comments')
  .post(async (req, res) => {
    // Creates a new comment
    let id;
    
    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      res.status(400).render('error', {errorCode: 400, searchValue: "Library"});
    }

    let text;
    
    try {
      text = req.body.text;
      text = validation.checkString(text);
    } catch (e) {
      res.status(400).render('libraries/library', {errorCode: 400, searchValue: "Library"}); // RENDER ERROR MESSAGE ON CREATE COMMENTS SECTION
    }
    
    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: 404, searchValue: "Library"});
    }

    try {
      let userid = req.session.user._id.toString();
      let createComment = await libraryData.createComment(id, userid, text);
      res.redirect(`libraries/library/${id}`);
    } catch (e) {
      res.status(500).render('error', {errorCode: 500, title: "Error Page"});
    }

    // try {
    //   newLibraryData.ownerID = validation.checkValidId(
    //     newLibraryData.ownerID,
    //     "Library Owner ID"
    //   );
    // } catch (e) {
    //   errors.push(e);
    // }
    // try {
    //   // TODO: THIS WILL BE UPDATED BECAUSE THE WAY OF SERVY CHANGING
    //   newLibraryData.fullness = parseInt(newLibraryData.fullness);
    //   newLibraryData.fullness = validation.isValidNumber(
    //     newLibraryData.fullness,
    //     "Fullness Rating"
    //   );
    //   if (0 > newLibraryData.fullness || newLibraryData.fullness > 5) {
    //     throw "Fullness rating must be between 0-5";
    //   }
    // } catch (e) {
    //   errors.push(e);
    // }
    // try {
    //   // TODO:THIS WILL BE UPDATED BECAUSE THE WAY OF SERVY CHANGING
    //   newLibraryData.genres = validation.checkStringArray(
    //     newLibraryData.genres,
    //     "Genres Available"
    //   );
    // } catch (e) {
    //   errors.push(e);
    // }
    // if (errors.length > 0) {
    //   res.render("libraries/new", {
    //     errors: errors,
    //     hasErrors: true,
    //     library: newLibraryData,
    //     title: "Creating a Library",
    //     id: "NEED TO FIX",
    //   });
    //   return;
    // }
    // try {
    //   const { name, ownerID, fullnessRating, genres } = newLibraryData;
    //   const newLibrary = await libraryData.create(
    //     name,
    //     location,
    //     image,
    //     ownerID,
    //     fullnessRating,
    //     genres
    //   );
    //   res.json(newLibrary); // TODO: will probably be to the library's page
    // } catch (e) {
    //   res
    //     .status(500)
    //     .render({ errorCode: 500, title: "error", id: "NEED TO FIX" });
    // }
  });

router.route('/:id/comments/:commentid')
  .post(async (req, res) => {
    // Allows a user to like a comment

    let id;
    let commentid;
    
    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      res.status(400).render('error', {errorCode: 400, searchValue: "Library"});
    }

    // If the comment ID is not valid, render the error page with a status code of 400
    try {
      commentid = req.params.commentid;
      commentid = validation.checkValidId(commentid);
    } catch (e) {
      return res.status(400).render('error', {errorCode: 400, searchValue: "Comment"});
    }

    let library;

    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).send("Error: No library with given ID");
    }

    try {
      let userid = req.session.user._id.toString();
      let likeComment = await libraryData.likeComment(userid, commentid);
      res.redirect(`libraries/library/${id}`);
    } catch (e) {
      res.status(500).render('error', {errorCode: 500, title: "Error Page"});
    }
  })
  .put(async (req, res) => {
    // Allows a user to edit their comment
  })
  .delete(async (req, res) => {
    // Allows a user to delete their comment
  });

export default router;
