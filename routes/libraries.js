import { Router } from "express";
const router = Router();
import { libraryData } from "../data/index.js";
import validation from "../validation.js";

router
  .route("/")
  .get(async (req, res) => {
    // Currently just sents json of all libraries
    try {
      const libraryList = await libraryData.getAllLibraries();
      res.json(libraryList);
    } catch (e) {
      res.status(500).json({ error: e });
    }
  })
  .post(async (req, res) => {
    // TODO: Will need to edit for location and new servay
    const newLibraryData = req.body;
    let errors = [];
    // TODO: NEED TO UNDATE FOR LOCATION AND IMAGE
    try {
      newLibraryData.title = validation.checkString(
        newLibraryData.title,
        "Name"
      );
    } catch (e) {
      errors.push(e);
    }
    try {
      newLibraryData.ownerID = validation.checkValidId(
        newLibraryData.ownerID,
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
    if (errors.length > 0) {
      res.render("libraries/new", {
        errors: errors,
        hasErrors: true,
        library: newLibraryData,
        title: "Creating a Library",
        id: "NEED TO FIX",
      });
      return;
    }
    try {
      const { name, ownerID, fullnessRating, genres } = newLibraryData;
      const newLibrary = await libraryData.create(
        name,
        location,
        image,
        ownerID,
        fullnessRating,
        genres
      );
      res.json(newLibrary); // TODO: will probably be to the library's page
    } catch (e) {
      res
        .status(500)
        .render({ errorCode: 500, title: "error", id: "NEED TO FIX" });
    }
  });

router.route("/new").get(async (req, res) => {
  // need to come back and fix the ID with cookie stuff
  res.render("libraries/new", {
    title: "Creating a Library",
    id: "NEED TO FIX",
  });
});

router.route("/:id").post(async (req, res) => {
  // Grab the library id
  const libraryId = req.params.id;
  // Grab the form data
  const updateData = req.body;
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
    res.status(500).json({ error: e });
  }
});

export default router;
