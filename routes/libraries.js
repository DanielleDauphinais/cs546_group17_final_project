import { Router } from "express";
const router = Router();
import { libraryData, userData } from "../data/index.js";
import validation from "../public/js/validators/validation.js";
import {checkImageFileString, validationsForStrings} from "../public/js/validators/util.js";
import axios from 'axios';
import xss from 'xss';
import fs from "fs";
import { upload } from "./image.js";
import { sanitise } from "../middlewares/xss.js";

router.route("/").get(async (req, res) => {
  try {
    let libraries = await libraryData.getAllLibraries();
    res.send(libraries);
  } catch (e) {
    res.status(500).render("error", { errorCode: 500, title: "error", isLoggedIn: true });
  }
});

const createNewLibrary = async (
  newLibraryData,
  address,
  req,
  genresInput,
  res,
  errors
) => {
  try {
    const { name, lat, lng, fullness } = newLibraryData;

    if (!process.env.DOMAIN)
      return res.status(500).render("error", { errorCode: 500, title: "Error" });
    
    const newLibrary = await libraryData.create(
      xss(name),
      [lat, lng],
      address,
      process.env.DOMAIN + req.file.path,
      req.session.user._id,
      fullness,
      genresInput
    );

    return res.redirect(`/libraries/${newLibrary._id}`);
  } catch (e) {
    if (typeof e === "string" && e.startsWith("VError")) {
      console.log(e)
      //errors.push(e.substr(1));

      return res.status(400).render("libraries/new", {
        title: "Creating a Library",
        user: req.session.user,
        editOrCreate: "Create",
        nameError: e.substr(1),
        hasErrors: true,
        library: newLibraryData,
        formAction: "/libraries/new",
        formMethod: "POST",
        isLoggedIn: true
      });
    }

    return res.status(500).render("error", {
      errorCode: 500,
      title: "error",
      id: req.session.user._id,
    });
  }
};

const editLibrary = async (
  id,
  editedLibraryData,
  address,
  req,
  genresInput,
  res,
  errors
) => {
  let image;
  const { name, lat, lng, fullness } = editedLibraryData;
  try {
    id = req.params.id;
    id = validation.checkValidId(id);

    if (!process.env.DOMAIN)
      return res.status(500).render("error", { errorCode: 500, title: "Error" });
    
    if (!req.file){
      let library;
      try {
        library = await libraryData.get(id);
      } catch (e) {
        return res
          .status(404)
          .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
      }
      image = library.image
    }
    else{
      image = process.env.DOMAIN + req.file.path;
    }
    // If the library is not found, render the error page with a status code of 404
    const editedLibrary = await libraryData.editLibrary(
      id,
      name,
      [lat, lng],
      address,
      image,
      req.session.user._id,
      fullness,
      genresInput
    );

    return res.redirect(`/libraries/${editedLibrary._id}`);
  } catch (e) {
    if (typeof e === "string" && e.startsWith("VError")) {
      errors.push(e.substr(1));
      let library = {
        name: name,
        lat: lat,
        lng: lng,
        coordinates: [lat, lng],
        image: image,
        fullnessRating: fullness,
        genres: genresInput,
      }

      return res.status(400).render("libraries/new", {
        title: "Editing a Library",
        user: req.session.user,
        editOrCreate: "Edit",
        nameError: e.substr(1),
        hasErrors: true,
        library: library,
        formAction: `/libraries/${id}/edit`,
        formMethod: "POST",
        name: library.name,
        image: image,
        libraryObject: JSON.stringify(library),
        isLoggedIn: true
      });
    }

    if ((typeof e === "string") && (e === "Error: User is not the library's owner.")) {
      return res
        .status(403)
        .render("error", { errorCode: "403", searchValue: "Library", title: "Forbidden" });
    }
    return res.status(500).render("error", {
      errorCode: 500,
      title: "error",
      id: req.session.user._id,
    });
  }
};

const reverseGeoCodeCoordinates = async (newLibraryData) => {
  let city = "";
  let city2 = "";
  let address = "";

  /** This axios request does reverse geocatching to get the address of the library */
  let data = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLibraryData.lat},${newLibraryData.lng}&key=AIzaSyAPxSPvWssw3gI4W1qJaFk9xlBqBicI3iY`
  );
  if (
    !data.data.results ||
    data.data.results.length === 0 ||
    data.data.status === "ZERO_RESULTS"
  )
    throw "Error: Location not found for these co-ordinates";

  city2 = data.data.results[5].address_components[0].long_name;
  city = data.data.results[7].address_components[0].long_name;
  address = data.data.results[0].formatted_address;

  // if ((city !== "Hoboken" && city2 === "Hoboken") || city2 === "07030") {
  // address = data.data.results[0].formatted_address;
  // } else {
  //   address = data.data.results[1].formatted_address;
  // }

  return { city, city2, address };
};

const handleValidationErrors = (
  res,
  req,
  action,
  errorField,
  error,
  newLibraryData
) => {
  let formAction = (action) => {
    if (action === "Create") {
      return "new";
    } else {
      return req.params.id + "/edit";
    }
  };
  let title = (action) => {
    if (action === "Create") {
      return "Creating a Library";
    } else {
      return "Editing a Library";
    }
  };

  let errorObj = {
    title: title(action),
    user: req.session.user,
    editOrCreate: action,
    hasErrors: true,
    library: newLibraryData,
    formAction: `/libraries/${formAction(action)}`,
    formMethod: "POST",
    isLoggedIn: true
  };
  errorObj[errorField] = error;

  /** We don't have to let the user know if any error has occured while deleting the image */
  if (req.file) fs.unlink(req.file.path, () => {});
  return res.status(400).render("libraries/new", errorObj);
};

async function routeValidationsForLibrary(newLibraryData, action, res, req) {
  let errors = [];
  try {
    newLibraryData.name = validation.checkString(
      xss(newLibraryData.name),
      "Library name"
    );
  } catch (e) {
    return handleValidationErrors(
      res,
      req,
      action,
      "nameError",
      e,
      newLibraryData
    );
  }

  try {
    newLibraryData.lat = Number(xss(newLibraryData.lat));
    newLibraryData.lat = validation.isValidNumber(
      newLibraryData.lat,
      "Librarys Latitude"
    );
  } catch (error) {
    return handleValidationErrors(res, req, "Create", "latError", error, newLibraryData);
  }

  try {
    newLibraryData.lng = Number(xss(newLibraryData.lng));
    newLibraryData.lng = validation.isValidNumber(
      newLibraryData.lng,
      "Librarys Longitude"
    );
  } catch (error) {
    return handleValidationErrors(res, req, "Create", "lngError", error, newLibraryData);
  }

  /** Something went wrong saving the image */
  if (action === "Create" && !req.file)
    return handleValidationErrors(
      res,
      req,
      action,
      "imageError",
      "Image is of invalid type or no image has been selected",
      newLibraryData
    );

  let addressObj = {};

  try {
    addressObj = await reverseGeoCodeCoordinates(newLibraryData);
  } catch (e) {
    if (
      typeof e === "string" &&
      e === "Error: Location not found for these co-ordinates"
    )
      return handleValidationErrors(
        res,
        req,
        action,
        "latError",
        e,
        newLibraryData
      );

    if (req.file) fs.unlink(req.file.path, () => {});

    return res.status(500).render("error", { errorNum: 500, title: "Error" });
  }

  let { city, city2, address } = addressObj;

  if (
    !address.includes("Hoboken") ||
    !address.toLowerCase().includes("hoboken")
  ) {
    newLibraryData.lat = "";
    newLibraryData.lng = "";
    errors.push("The location of the little free library must be in Hoboken");

    return handleValidationErrors(
      res,
      req,
      action,
      "latError",
      "The location of the little free library must be in Hoboken",
      newLibraryData
    );
  }

  if (address === "") {
    if (req.file) fs.unlink(req.file.path, () => {});

    return res.status(500).render("error", { errorNum: 500, title: "Error" });
  }

  try {
    req.session.user._id = validation.checkValidId(
      req.session.user._id,
      "Library Owner ID"
    );
  } catch (e) {
    return handleValidationErrors(
      res,
      req,
      action,
      "userError",
      e,
      newLibraryData
    );
  }

  /** Grab all the inputs from the request body. */
  let genresInput = [
    xss(newLibraryData.pictureBooks),
    xss(newLibraryData.youngAdultFiction),
    xss(newLibraryData.fantasyFiction),
    xss(newLibraryData.fairyTale),
    xss(newLibraryData.boardBook),
    xss(newLibraryData.nonFiction),
    xss(newLibraryData.mystery),
    xss(newLibraryData.graphicNovel),
    xss(newLibraryData.chapterBooks),
  ];

  /** For every value, if it does not exist, then the checkbox was not selected. */
  genresInput = genresInput.filter((genre) => {
    return genre !== "";
  });

  try {
    newLibraryData.fullness = validation.isValidNumber(
      parseInt(xss(newLibraryData.fullness)),
      "Fullness Rating"
    );

    if (0 > newLibraryData.fullness || newLibraryData.fullness > 5) {
      errors.push("Fullness rating must be between 0-5");
      return handleValidationErrors(
        res,
        req,
        action,
        "fullnessError",
        "Fullness rating must be between 0-5.",
        newLibraryData
      );
    }

    genresInput = validation.checkStringArray(genresInput, "Genres Available");

    if (genresInput.length === 0 && newLibraryData.fullness !== 0) {
      errors.push("Must specify at least one genre for a non-empty library.");
      return handleValidationErrors(
        res,
        req,
        action,
        "genresError",
        "Must specify at least one genre for a non-empty library.",
        newLibraryData
      );
    }
  } catch (e) {
    errors.push(e);
    return handleValidationErrors(
      res,
      req,
      action,
      "fullnessError",
      e,
      newLibraryData
    );
  }

  try {
    if (action === "Create"  || req.file)
      checkImageFileString(req.file.path, "Image upload");
  } catch (e) {
    /** This can be used to remove file from data */
    errors.push(e);
    return handleValidationErrors(
      res,
      req,
      action,
      "imageError",
      e,
      newLibraryData
    );
  }

  /** If there are errors found on the routes rerender the pages with errors! */
  if (errors.length > 0) {
    fs.unlink(req.file.path, () => {});
    return handleValidationErrors(
      res,
      req,
      action,
      "errors",
      errors,
      newLibraryData
    );
  }

  newLibraryData.address = address;
  newLibraryData.genresInput = genresInput;
  newLibraryData.errors = errors;
}

router
  .route("/new")
  .get(async (req, res) => {
    res.render("libraries/new", {
      title: "Creating a Library",
      editOrCreate: "Create",
      user: req.session.user,
      formAction: "/libraries/new",
      formMethod: "POST",
      isLoggedIn: true
    });
  })
  .post(upload.single("image"), sanitise, async (req, res) => {
    const newLibraryData = req.body;
    await routeValidationsForLibrary(newLibraryData, "Create", res, req);

    /**
     * By default the status code is 200 and we don't send any 200 in the above function
     * this will prevent resending the headers.
     */
    if (res.statusCode === 200)
      await createNewLibrary(
        newLibraryData,
        newLibraryData.address,
        req,
        newLibraryData.genresInput,
        res,
        newLibraryData.errors
      );
  });

router
  .route("/:id")
  .get(async (req, res) => {
    let id;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = xss(req.params.id);
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
      let comments = library.comments;
      comments.forEach((x) => {
        x.numLikes = x.likes.length;
      });
    } catch (e) {
      return res
        .status(404)
        .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
    }

    let followers;
    try {
      followers = await userData.getFollowers(id);
    } catch (error) {
      console.error(error)
      return res.status(500).render("error", { errorCode: "500", title: "Error" });
    }

    let owner;

    try {
      owner = await userData.getUserById(library.ownerID);
    } catch (e) {
      return res
        .status(404)
        .render("error", { errorCode: "404", searchValue: "User", title: "Not Found" });
    }

    try {
      let user = req.session.user;
      let isFollower = library.favorites.includes(user._id)
      res.render("libraries/library", {
        title: library.name,
        isLoggedIn: true,
        script_partial: "comment",
        userid: user._id,
        owner: owner.userName,
        followers : followers,
        ownerID: owner._id,
        libraryid: library._id,
        isFollower: isFollower,
        errors: false,
        ...library,
      });
    } catch (e) {
      res.status(500).render("error", { errorCode: "500", title: "Error" });
    }
  })
  .post(async (req, res) => {
    // Allows a user to favorite/unfavorite a library
    let id;
    let user = req.session.user;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = xss(req.params.id);
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res
        .status(404)
        .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
    }
    try {
      let favorite = await userData.favoriteLibrary(user._id, library._id);
      res.redirect(`/libraries/${library._id}`);
    } catch (e) {
      res.status(500).render("error", { errorCode: "500", title: "Error" });
    }
  });

router
  .route("/:id/edit")
  .get(async (req, res) => {
    // Allows a user to edit their library
    /* Render Create Form with Update Params */

    /* Validation from above */
    let id;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = xss(req.params.id);
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res
        .status(404)
        .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
    }

    try {
      if (library.ownerID !== req.session.user._id) {
        throw "Error: Not the owner of the library";
      }
    } catch (e) {
      return res
        .status(403)
        .render("error", { errorCode: "403", searchValue: "Library", title: "Forbidden" });
    }

    try {
      res.render("libraries/new", {
        title: "Editing a Library",
        editOrCreate: "Edit",
        user: req.session.user,
        formAction: `/libraries/${id}/edit`,
        formMethod: "POST",
        libraryObject: JSON.stringify(library),
        name: library.name,
        image: library.image,
        isLoggedIn: true
      });
    } catch (e) {
      return res.status(500).render("error", { errorCode: "500", title: "Error" });
    }
  })
  .post(upload.single("image"), sanitise, async (req, res) => {
    // Update the library with the form data
    const updatedLibraryData = req.body;

    await routeValidationsForLibrary(updatedLibraryData, "Edit", res, req);

    let id;
    try {
      id = xss(req.params.id);
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
    }
    /**
     * By default the status code is 200 and we don't send any 200 in the above function
     * this will prevent resending the headers.
     */
    if (res.statusCode === 200)
      await editLibrary(
        id,
        updatedLibraryData,
        updatedLibraryData.address,
        req,
        updatedLibraryData.genresInput,
        res,
        updatedLibraryData.errors
      );
  });

router.route("/:id/delete").post(async (req, res) => {
  // Allows a user to delete their library
  let id;

  // If the library ID is not valid, render the error page with a status code of 400
  try {
    id = xss(req.params.id);
    id = validation.checkValidId(id);
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
  }

  let library;

  // If the library is not found, render the error page with a status code of 404
  try {
    library = await libraryData.get(id);
    let comments = library.comments;
    comments.forEach((x) => {
      x.numLikes = x.likes.length;
    });
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
  }

  try {
    if (library.ownerID !== req.session.user._id) {
      throw "Error: Not the owner of the library";
    }
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Library", title: "Bad Request" });
  }

  try {
    await libraryData.removeLibrary(id, req.session.user._id);
  } catch (e) {
    return res.status(500).render("error", { errorCode: "404", title: "Not Found" });
  }

  res.redirect(`/users/${req.session.user._id}`);
});

router
  .route("/:id/survey")
  .get(async (req, res) => {
    // Renders the survey page to rate fullness and input genres
    // If the library ID is not valid, render the error page with a status code of 400
    let id;
    try {
      xss(id = req.params.id);
      id = validation.checkValidId(id);
    } catch (e) {
      return res.status(400).render("error", {
        errorCode: 400,
        searchValue: "Library",
        title: "Error Page",
      });
    }
    try {
      res.render("libraries/fullness", { id: id, title: "Fullness" });
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
      return res.status(400).render("error", {
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
      id = xss(req.params.id);
      id = validation.checkValidId(id);
    } catch (e) {
      res.status(400).render('error', {errorCode: "400", searchValue: "Library ID", title: "Bad Request"});
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res.status(404).render('error', {errorCode: "404", searchValue: "Library", title: "Not Found"});
    }

    let text;
    
    try {
      text = xss(req.body.text);
      text = validation.checkString(text, "Comment Body");
    } catch (e) {
      return res.render('partials/comment', {layout: null, errors: true, errorMessage: e});
    }

    let user = req.session.user;

    try {
      library.comments.forEach(x => {
        let today = new Date().toLocaleDateString();
        if ((x.userId === user._id) && (x.dateCreated.split(',')[0] === today)) throw "A maximum of one comment can be made per day. User has already commented on this post once today.";
      })
    } catch (e) {
      let numFavorites = library.favorites.length;
      return res.render('partials/comment', {layout: null, errors: true, errorMessage: e});
    }

    try {
      let createComment = await libraryData.createComment(id, user._id, user.userName, text);
      res.render('partials/comment', {layout: null, library, libraryid: library._id, userid: user._id, numLikes: createComment.likes.length, userId: user._id, ...createComment});
    } catch (e) {
      res.status(500).render('error', {errorCode: "500", title: "Error Page"});
    }
  });

router.route("/:id/comments/:commentid").post(async (req, res) => {
  // Allows a user to like a comment

  let id;
  let commentid;

  // If the library ID is not valid, render the error page with a status code of 400
  try {
    id = xss(req.params.id);
    id = validation.checkValidId(id);
  } catch (e) {
    res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
  }

  // If the comment ID is not valid, render the error page with a status code of 400
  try {
    commentid = req.params.commentid;
    commentid = validation.checkValidId(commentid);
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Comment ID", title: "Bad Request" });
  }

  let library;

  try {
    library = await libraryData.get(id);
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
  }

  try {
    let userid = req.session.user._id.toString();
    let likeComment = await libraryData.likeComment(id, userid, commentid);
    res.redirect(`/libraries/${id}`);
  } catch (e) {
    res.status(500).render("error", { errorCode: "500", title: "Error Page" });
  }
});

router.route("/:id/comments/:commentid/edit").post(async (req, res) => {
  // Allows a user to edit their comment

  let id;
  let commentid;

  // If the library ID is not valid, render the error page with a status code of 400
  try {
    id = xss(req.params.id);
    id = validation.checkValidId(id);
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
  }

  // If the comment ID is not valid, render the error page with a status code of 400
  try {
    commentid = xss(req.params.commentid);
    commentid = validation.checkValidId(commentid);
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Comment ID", title: "Bad Request" });
  }

  let library;

  try {
    library = await libraryData.get(id);
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
  }

  let text;

  // If the input text is not valid, render the error page with a status code of 400
  try {
    text = xss(req.body.update_text_input);
    text = validation.checkString(text, "Comment Body");
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Comment Body", title: "Bad Request" });
  }

  try {
    let user = req.session.user;
    let editComment = await libraryData.editComment(user._id, commentid, text);
    res.redirect(`/libraries/${id}`);
  } catch (e) {
    res.status(500).render("error", { errorCode: "500", title: "Error Page" });
  }
});

router.route("/:id/comments/:commentid/delete").post(async (req, res) => {
  // Allows a user to delete their comment

  let id;
  let commentid;

  // If the library ID is not valid, render the error page with a status code of 400
  try {
    id = xss(req.params.id);
    id = validation.checkValidId(id);
  } catch (e) {
    res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Library ID", title: "Bad Request" });
  }

  // If the comment ID is not valid, render the error page with a status code of 400
  try {
    commentid = xss(req.params.commentid);
    commentid = validation.checkValidId(commentid);
  } catch (e) {
    return res
      .status(400)
      .render("error", { errorCode: "400", searchValue: "Comment ID", title: "Bad Request" });
  }

  let library;

  try {
    library = await libraryData.get(id);
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorCode: "404", searchValue: "Library", title: "Not Found" });
  }

  try {
    let user = req.session.user;
    let deleteComment = await libraryData.deleteComment(
      id,
      user._id,
      commentid
    );
    res.redirect(`/libraries/${id}`);
  } catch (e) {
    console.log(e);
    res.status(500).render("error", { errorCode: "500", title: "Error Page", title: "Error" });
  }
});

export default router;
