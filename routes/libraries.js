import { Router } from "express";
const router = Router();
import { libraryData, userData } from "../data/index.js";
import validation from "../public/js/validators/validation.js";
import {checkImageFileString, validationsForStrings} from "../public/js/validators/util.js";
import axios from 'axios';
import xss from 'xss';
import fs from "fs";
import { upload } from "./image.js";

router.route("/").get(async (req, res) => {
  try {
    let libraries = await libraryData.getAllLibraries();
    res.send(libraries);
  } catch (e) {
    res.status(500).render("error", { errorCode: 500 });
  }
});

const createNewLibrary = async (newLibraryData, address, req, genresInput, res, errors) => {
  try {
    const { name, lat, lng, fullness } = newLibraryData;

    if (!process.env.DOMAIN) return res.status(500).render("error", { errorCode: 500 });

    const newLibrary = await libraryData.create(
      name,
      [lat, lng],
      address,
      process.env.DOMAIN + req.file.path,
      req.session.user._id,
      fullness,
      genresInput
    );

    return res.redirect(`/libraries/${newLibrary._id}`);
  } catch (e) {
    if ((typeof e === "string") && e.startsWith("VError")) {
      errors.push(e.substr(1));

      return res.status(400).render(
        "libraries/new",
        {
          title: "Creating a Library",
          user: req.session.user,
          editOrCreate: "Create",
          nameError: e.substr(1),
          hasErrors: true,
          library: newLibraryData
        }
      );
    }

    console.error(e);
    return res.status(500).render("error", { errorCode: 500, title: "error", id: req.session.user._id });
  }
}

const reverseGeoCodeCoordinates = async (newLibraryData) => {
  let city = '';
  let city2 = '';
  let address = '';

  /** This axios request does reverse geocatching to get the address of the library */
  let data = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLibraryData.lat},${newLibraryData.lng}&key=AIzaSyAPxSPvWssw3gI4W1qJaFk9xlBqBicI3iY`);

  if (!data.data.results || (data.data.results.length === 0) || (data.data.status === "ZERO_RESULTS")) throw "Error: Location not found for these co-ordinates";

  city2 = data.data.results[5].address_components[0].long_name;
  city = data.data.results[7].address_components[0].long_name;

  if (city !== "Hoboken" && city2 === "Hoboken" || city2 === "07030") {
    address = data.data.results[0].formatted_address;
  } else {
    address = data.data.results[1].formatted_address;
  }

  return { city, city2, address };
}

const handleValidationErrors = (res, req, action, errorField, error, newLibraryData) => {
  let errorObj = {
    title: "Creating a Library",
    user: req.session.user,
    editOrCreate: action,
    hasErrors: true,
    library: newLibraryData
  };
  errorObj[errorField] = error;

  /** We don't have to let the user know if any error has occured while deleting the image */
  if (req.file) fs.unlink(req.file.path, () => { });

  return res.status(400).render("libraries/new", errorObj);
}

async function routeValidationsForLibrary(newLibraryData, res, req) {
  let errors = [];

  try {
    newLibraryData.name = validation.checkString(newLibraryData.name, "Library name");
    validationsForStrings("Library Name", newLibraryData.name, false, {min: 3, max:40});
  } catch (e) {
    return handleValidationErrors(res, req, "Create", "nameError", e, newLibraryData);
  }

  try {
    newLibraryData.lat = Number(newLibraryData.lat);
    newLibraryData.lat = validation.isValidNumber(newLibraryData.lat, "Librarys Latitude");
  } catch (error) {
    return handleValidationErrors(res, req, "Create", "latError", error, newLibraryData);
  }

  try {
    newLibraryData.lng = Number(newLibraryData.lng);
    newLibraryData.lng = validation.isValidNumber(newLibraryData.lng, "Librarys Longitude");
  } catch (error) {
    return handleValidationErrors(res, req, "Create", "lngError", error, newLibraryData);
  }

  /** Something went wrong saving the image */
  if (!req.file) return handleValidationErrors(res, req, "Create", "imageError", "Image is of invalid type or no image has been selected", newLibraryData);

  let addressObj = {};

  try {
    addressObj = await reverseGeoCodeCoordinates(newLibraryData);
  } catch (e) {
    if (
      (typeof e === "string") &&
      (e === "Error: Location not found for these co-ordinates")
    ) return handleValidationErrors(res, req, "Create", "latError", e, newLibraryData);

    if (req.file) fs.unlink(req.file.path, () => { });

    console.error(e);
    return res.status(500).render('error', { errorNum: 500, title: "Error" });
  }

  let { city, city2, address } = addressObj;

  if (
    (city !== "Hoboken" && city2 !== "Hoboken" && city2 !== "07030") ||
    !address.includes("Hoboken") ||
    !address.toLowerCase().includes("hoboken")
  ) {
    newLibraryData.lat = ''
    newLibraryData.lng = ''
    errors.push("The location of the little free library must be in Hoboken");

    return handleValidationErrors(res, req, "Create", "latError", "The location of the little free library must be in Hoboken", newLibraryData);
  }

  if (address === '') {
    if (req.file) fs.unlink(req.file.path, () => { });

    console.error(e);
    return res.status(500).render('error', { errorNum: 500, title: "Error" });
  }

  try {
    req.session.user._id = validation.checkValidId(req.session.user._id, "Library Owner ID");
  } catch (e) {
    return handleValidationErrors(res, req, "Create", "userError", e, newLibraryData);
  }

  /** Grab all the inputs from the request body. */
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

  /** For every value, if it does not exist, then the checkbox was not selected. */
  genresInput = genresInput.filter((genre) => {
    return typeof genre === "string";
  });

  try {
    newLibraryData.fullness = validation.isValidNumber(parseInt(newLibraryData.fullness), "Fullness Rating");

    if (0 > newLibraryData.fullness || newLibraryData.fullness > 5) {
      errors.push("Fullness rating must be between 0-5");
      return handleValidationErrors(res, req, "Create", "fullnessError", "Fullness rating must be between 0-5.", newLibraryData);
    }

    genresInput = validation.checkStringArray(genresInput, "Genres Available");

    if (genresInput.length === 0 && newLibraryData.fullness !== 0) {
      errors.push("Must specify at least one genre for a non-empty library.");
      return handleValidationErrors(res, req, "Create", "genresError", "Must specify at least one genre for a non-empty library.", newLibraryData);
    }
  } catch (e) {
    errors.push(e);
    return handleValidationErrors(res, req, "Create", "fullnessError", e, newLibraryData);
  }

  try {
    checkImageFileString(req.file.path, "Image upload");
  } catch (e) {
    /** This can be used to remove file from data */
    errors.push(e);
    return handleValidationErrors(res, req, "Create", "imageError", e, newLibraryData);
  }

  /** If there are errors found on the routes rerender the pages with errors! */
  if (errors.length > 0) {
    fs.unlink(req.file.path, () => { });
    return handleValidationErrors(res, req, "Create", "errors", errors, newLibraryData);
  }

  newLibraryData.address = address;
  newLibraryData.genresInput = genresInput;
  newLibraryData.errors = errors;
}

router
  .route("/new")
  .get(async (req, res) => {
    res.render("libraries/new", { title: "Creating a Library", editOrCreate: "Create", user: req.session.user });
  })
  .post(upload.single('image'), async (req, res) => {
    const newLibraryData = req.body;

    await routeValidationsForLibrary(newLibraryData, res, req);

    /** 
     * By default the status code is 200 and we don't send any 200 in the above function
     * this will prevent resending the headers.
     */
    if (res.statusCode === 200) await createNewLibrary(newLibraryData, newLibraryData.address, req, newLibraryData.genresInput, res, newLibraryData.errors);
  });

router
  .route("/:id")
  .get(async (req, res) => {
    let id;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Library ID"});
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
      let comments = library.comments;
      comments.forEach(x => {
        x.numLikes = x.likes.length;
      });
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library"});
    }

    let owner;

    try {
      owner = await userData.getUserById(library.ownerID);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "User"});
    }

    try {
      let user = req.session.user;
      let numFavorites = library.favorites.length;
      res.render('libraries/library', { 
        title: library.name, 
        isLoggedIn: true, 
        script_partial: 'comment', 
        userid: user._id, 
        owner: owner.userName,
        libraryid: library._id,
        numFavorites: numFavorites,
        ...library
      });
    } catch (e) {
      res.status(500).render('error', {errorCode: "500"});
    }
  })
  .post(async (req, res) => {
    // Allows a user to favorite/unfavorite a library
    let id;
    let user = req.session.user;
    
    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Library ID"});
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library"});
    }

    try {
      let favorite = await userData.favoriteLibrary(user._id, library._id);
      res.redirect(`/libraries/${library._id}`);
    } catch (e) {
      console.log(e);
      res.status(500).render('error', {errorCode: "500"});
    }
  })
  .put(async (req, res) => {
    // Allows a user to edit their library
    /* Render Create Form with Update Params */
  })
  .delete(async (req, res) => {
    // Allows a user to delete their library
  });

router
  .route("/:id/survey")
  .get(async (req, res) => {
    // Renders the survey page to rate fullness and input genres
    // If the library ID is not valid, render the error page with a status code of 400
    let id;
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", {
          errorCode: 400,
          searchValue: "Library",
          title: "Error Page",
        });
    }
    try {
      res.render("libraries/fullness", { id: id });
    } catch (e) {
      res.status(500).render("error", { errorCode: 500, title: "Error Page" });
    }
  })
  .post(async (req, res) => {
    /**
     * @name libraries/:id/survey
     * @author jcarr2
     * @description Allows a user to edit the fullness rating and currently held genres of a library
     */

    /* Rehashed Data Validation from Above */

    // Check validity of id
    let id;
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", {
          errorCode: 400,
          searchValue: "Library",
          title: "Error Page",
        });
    }

    // Check validity of the form data (Still uses json, would check to make sure that this isn't just a debug throw).
    let updateData = req.body;
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
      /* Fullness Validation */
      // Parse Fullness into an Number, xss Validation
      updateData.fullness = validation.isValidNumber(
        parseInt(xss(updateData.fullness)),
        "Fullness Rating"
      );

      // Check that fullness is of proper range
      if (updateData.fullness < 0 || updateData.fullness > 5) {
        throw "Error: Improper Range on Fullness!";
      }

      /* Genre Validation */
      // Grab all of the inputs from the request body.
      let genresInput = [
        req.body.pictureBooks,
        req.body.youngAdultFiction,
        req.body.fantasyFiction,
        req.body.fairyTale,
        req.body.boardBook,
        req.body.nonFiction,
        req.body.mystery,
        req.body.graphicNovel,
        req.body.chapterBooks,
      ];

      // For every value, if it does not exist, then the checkbox was not selected.
      genresInput = genresInput.filter((genre) => {
        return typeof genre === "string";
      });

      // Scrub with xss to prevent xss on non-undefined values.
      genresInput = genresInput.map((genre) => {
        return xss(genre);
      });

      // List of Genre Strings
      let genres = [
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
      genresInput.forEach((genre) => {
        if (!genres.includes(genre)) {
          throw "Error: Invalid genre string data!";
        }
      });

      // Remove duplicates (Using set inherent properties to remove duplicates).
      genresInput = [...new Set(genresInput)];

      // If the value is non-empty for fullness, there must be at least one genre.
      if (genresInput.length === 0 && updateData.fullness !== 0) {
        return res.render("libraries/fullness", {
          id: id,
          error:
            "You must select at least one genre if the library is non-empty!",
          title: "Fullness Form",
        });
      }

      // If the library is empty, there must not be any genres.
      if (genresInput.length > 0 && updateData.fullness === 0) {
        return res.render("libraries/fullness", {
          id: id,
          error: "An empty library cannot have any genres specified!",
          title: "Fullness Form",
        });
      }

      /* Update Library */
      // Run update function
      const updatedLibrary = await libraryData.formUpdate(
        id,
        updateData.fullness,
        genresInput
      );

      // Debug output
      // res.json(updatedLibrary);

      // Actual output
      res.redirect(`/libraries/${id}`);
    } catch (e) {
      return res
        .status(500)
        .render("error", { errorCode: 500, title: "Error Page" });
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
      res.status(400).render('error', {errorCode: "400", searchValue: "Library ID"});
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library"});
    }

    let text;
    
    try {
      text = req.body.text;
      text = validation.checkString(text, "Comment Body");
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Comment Body"});
    }

    try {
      let user = req.session.user;
      let createComment = await libraryData.createComment(id, user._id, user.userName, text);
      res.render('partials/comment', {layout: null, library, libraryid: library._id, userid: user._id, userId: user._id, ...createComment});
    } catch (e) {
      console.log(e);
      res.status(500).render('error', {errorCode: "500", title: "Error Page"});
    }
  });

router
  .route("/:id/comments/:commentid")
  .post(async (req, res) => {
    // Allows a user to like a comment

    let id;
    let commentid;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      res.status(400).render('error', {errorCode: "400", searchValue: "Library ID"});
    }

    // If the comment ID is not valid, render the error page with a status code of 400
    try {
      commentid = req.params.commentid;
      commentid = validation.checkValidId(commentid);
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Comment ID"});
    }

    let library;

    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library"});
    }

    try {
      let userid = req.session.user._id.toString();
      let likeComment = await libraryData.likeComment(id, userid, commentid);
      res.redirect(`/libraries/${id}`);
    } catch (e) {
      res.status(500).render('error', {errorCode: "500", title: "Error Page"});
    }
  });

router.route('/:id/comments/:commentid/edit')
  .post(async (req, res) => {
    // Allows a user to edit their comment

    let id;
    let commentid;
    
    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Library ID"});
    }

    // If the comment ID is not valid, render the error page with a status code of 400
    try {
      commentid = req.params.commentid;
      commentid = validation.checkValidId(commentid);
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Comment ID"});
    }
    
    let library;

    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library"});
    }

    let text;
    
    // If the input text is not valid, render the error page with a status code of 400
    try {
      text = req.body.update_text_input;
      text = validation.checkString(text, "Comment Body");
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Comment Body"});
    }

    try {
      let user = req.session.user;
      let editComment = await libraryData.editComment(user._id, commentid, text);
      res.redirect(`/libraries/${id}`);
    } catch (e) {
      res.status(500).render('error', {errorCode: "500", title: "Error Page"});
    }
  });

router.route('/:id/comments/:commentid/delete')
  .post(async (req, res) => {
    // Allows a user to delete their comment

    let id;
    let commentid;
    
    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      res.status(400).render('error', {errorCode: "400", searchValue: "Library ID"});
    }

    // If the comment ID is not valid, render the error page with a status code of 400
    try {
      commentid = req.params.commentid;
      commentid = validation.checkValidId(commentid);
    } catch (e) {
      return res.status(400).render('error', {errorCode: "400", searchValue: "Comment ID"});
    }
    
    let library;

    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library"});
    }

    try {
      let user = req.session.user;
      let deleteComment = await libraryData.deleteComment(id, user._id, commentid);
      res.redirect(`/libraries/${id}`);
    } catch (e) {
      res.status(500).render('error', {errorCode: "500", title: "Error Page"});
    }
  });

export default router;
