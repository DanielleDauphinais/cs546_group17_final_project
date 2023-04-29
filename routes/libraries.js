import { Router } from "express";
const router = Router();
import { libraryData } from "../data/index.js";
import validation from "../public/js/validators/validation.js";
import multer from "multer";
import xss from "xss";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => {
    let extension = file.originalname.split(".")[1];
    console.log(`${extension} - is the extension`);
    // if(extension!= "jpeg" && extension!= "jpg" && extension!= "png" && extension!= "pdf"){
    //   throw `VError: photo input must have the extention .jpeg, .jpg, .png or .pdf`
    // }
    if (!extension) extension = "";
    else extension = "." + extension;

    return cb(null, `${Date.now()}${extension}`);
  },
});

const upload = multer({ storage });

router.route("/").get(async (req, res) => {
  try {
    let libraries = await libraryData.getAllLibraries();
    res.send(libraries);
  } catch (e) {
    res.status(500).render("error", { errorCode: 500 });
  }
});

router
  .route("/new")
  .get(async (req, res) => {
    // Render the new library form page

    // need to come back and fix the ID with cookie stuff
    try {
      res.render("libraries/new", {
        title: "Creating a Library",
        id: "NEED TO FIX",
      });
    } catch (error) {}
  })
  .post(
    async (req, res, next) => {
      // Submit the new library form page
      try {
        console.log(req.body);
        // validation.checkImageFileString(req.body.image, "Libarys Image");
        next();
      } catch (e) {
        // TODO: make it rerender!!!
        return res.status(400).send(`${e} Error: Invalid file type`);
      }
    },
    upload.single("image"),
    async (req, res) => {
      // Currently creates libary and sends json of created library
      if (!req.file) {
        // Something went wrong saving the image
        // TODO: make it rerender!!!
        return res.status(500).send({
          status: "Error",
          message:
            "Uh, Oh! Something wrong went on our side, we will fix it soon!",
        });
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
        newLibraryData.lat = parseInt(newLibraryData.lat);
        newLibraryData.lat = validation.isValidNumber(
          newLibraryData.lat,
          "Librarys Latitude"
        );
      } catch (error) {
        errors.push(e);
      }
      try {
        newLibraryData.lng = parseInt(newLibraryData.lng);
        newLibraryData.lng = validation.isValidNumber(
          newLibraryData.lng,
          "Librarys Longitude"
        );
      } catch (error) {
        errors.push(e);
      }
      try {
        req.user._id = validation.checkValidId(
          req.user._id,
          "Library Owner ID"
        );
      } catch (e) {
        errors.push(e);
      }
      try {
        // TODO: THIS WILL BE UPDATED BECAUSE THE WAY OF SERVY CHANGING
        newLibraryData.fullness = parseInt(newLibraryData.fullness);
        newLibraryData.fullness = validation.isValidNumber(
          newLibraryData.fullness,
          "Fullness Rating"
        );
        if (0 > newLibraryData.fullness || newLibraryData.fullness > 5) {
          throw "Fullness rating must be between 0-5";
        }
      } catch (e) {
        errors.push(e);
      }
      try {
        // TODO:THIS WILL BE UPDATED BECAUSE THE WAY OF SERVY CHANGING
        newLibraryData.genres = validation.checkStringArray(
          newLibraryData.genres,
          "Genres Available"
        );
      } catch (e) {
        errors.push(e);
      }
      // TODO: Need to add validation of req.file.path
      if (errors.length > 0) {
        res.render("libraries/new", {
          errors: errors,
          hasErrors: true,
          library: newLibraryData,
          title: "Creating a Library",
          id: "NEED TO FIX -> req.user._id",
        });
        return;
      }

      try {
        const { name, lat, lng, image, fullness } = newLibraryData;
        if (!process.env.DOMAIN) throw "Error: Env file not provided.";
        const newLibrary = await libraryData.create(
          name,
          lat,
          lng,
          process.env.DOMAIN + req.file.path,
          req.user._id,
          fullness,
          genres // TODO:Need to be updated
        );
        res.json(newLibrary); // TODO: will probably be to the library's page
      } catch (e) {
        console.log(e);
        res
          .status(500)
          .render({ errorCode: 500, title: "error", id: "NEED TO FIX" });
      }
    }
  );

router
  .route("/:id")
  .get(async (req, res) => {
    let id;

    // If the library ID is not valid, render the error page with a status code of 400
    try {
      id = req.params.id;
      id = validation.checkValidId(id);
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorCode: 400, searchValue: "Library" });
    }

    let library;

    // If the library is not found, render the error page with a status code of 404
    try {
      library = await libraryData.get(id);
    } catch (e) {
      return res
        .status(404)
        .render("error", { errorCode: 404, searchValue: "Library" });
    }

    try {
      res.render("libraries/library", {
        title: library.name,
        library: library,
        isLoggedIn: true,
        script_partial: "comment",
        userid: req.session.user._id,
      });
    } catch (e) {
      res.status(500).render("error", { errorCode: 500 });
    }
  })
  .post(async (req, res) => {
    // Allows a user to favorite/unfavorite a library
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
        .render("error", { errorCode: 400, searchValue: "Library" });
    }
    try {
      res.render("libraries/fullness", { id: id });
    } catch (e) {
      res.status(500).render("error", { errorCode: 500 });
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
        .render("error", { errorCode: 400, searchValue: "Library" });
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

router.route("/:id/comments").post(async (req, res) => {
  // Creates a new comment
  let id;

  // If the library ID is not valid, render the error page with a status code of 400
  try {
    id = req.params.id;
    id = validation.checkValidId(id);
  } catch (e) {
    res.status(400).render("error", { errorCode: 400, searchValue: "Library" });
  }

  let text;

  try {
    text = req.body.text;
    text = validation.checkString(text);
  } catch (e) {
    res
      .status(400)
      .render("libraries/library", { errorCode: 400, searchValue: "Library" }); // RENDER ERROR MESSAGE ON CREATE COMMENTS SECTION
  }

  let library;

  // If the library is not found, render the error page with a status code of 404
  try {
    library = await libraryData.get(id);
  } catch (e) {
    return res
      .status(404)
      .render("error", { errorCode: 404, searchValue: "Library" });
  }

  try {
    let userid = req.session.user._id.toString();
    let createComment = await libraryData.createComment(id, userid, text);
    res.redirect(`libraries/library/${id}`);
  } catch (e) {
    res.status(500).render("error", { errorCode: 500, title: "Error Page" });
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
      res
        .status(400)
        .render("error", { errorCode: 400, searchValue: "Library" });
    }

    // If the comment ID is not valid, render the error page with a status code of 400
    try {
      commentid = req.params.commentid;
      commentid = validation.checkValidId(commentid);
    } catch (e) {
      return res
        .status(400)
        .render("error", { errorCode: 400, searchValue: "Comment" });
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
      res.status(500).render("error", { errorCode: 500, title: "Error Page" });
    }
  })
  .put(async (req, res) => {
    // Allows a user to edit their comment
  })
  .delete(async (req, res) => {
    // Allows a user to delete their comment
  });

export default router;
