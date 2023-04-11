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
    // Currently creates libary and sents json of created library
    const newLibraryData = req.body;
    if (!newLibraryData || Object.keys(newLibraryData).length === 0) {
      return res
        .status(400)
        .json({ error: "There are no fields in the request body" });
    }
    try {
      // NEED TO UNDATE FOR LOCATION AND IMAGE
      newLibraryData.name = validation.checkString(newLibraryData.name, "Name");
      newLibraryData.ownerID = validation.checkId(
        newLibraryData.ownerID,
        "Library Owner ID"
      );
      newLibraryData.fullnessRating = validation.isValidNumber(
        newLibraryData.fullnessRating,
        "Fullness Rating"
      );
      newLibraryData.genres = validation.checkStringArray(
        newLibraryData.genres,
        "Genres Available"
      );
    } catch (e) {
      return res.status(400).json({ error: e });
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
      res.json(newLibrary);
    } catch (e) {
      res.status(500).json({ error: e });
    }
  });

/**
 * @name libraries/:id
 * Library Update Route, first attempt
 * This route is bound to get changed to a different one for updating other information, but for proof of concept, we're going with this.
 * @example This should take in data from a form, which should include fullness data and current genres available within the library.
 */
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
    updateData.fullnessRating = validation.isValidNumber(
      updateData.fullnessRating,
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
    const { fullnessRating, genres } = updateData;
    const updatedLibrary = await libraryData.formUpdate(
      libraryId,
      fullnessRating,
      genres
    );
    res.json(updatedLibrary);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

export default router;
