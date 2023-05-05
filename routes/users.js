import { Router } from "express";
const router = Router();
import { userData, libraryData } from "../data/index.js";
import validation from "../public/js/validators/validation.js";
import {
  validationsForCheckUser,
  validationsForCreateUser,
} from "../public/js/validators/user.js";
import xss from 'xss'

const { createUser, checkUser } = userData;

/**
 * @name http://localhost:3000/users/login
 */
router.get("/login", async (req, res) =>
  res.render("users/login", { title: "Login" })
);

router.post("/login", async (req, res) => {
  try {
    if (!req.body)
      return res.status(400).send("Error: Email and password are required");

    let emailAddress = xss(req.body.emailAddressInput)
    let password = xss(req.body.passwordInput)

    validationsForCheckUser(emailAddress.trim(), password.trim());

    let user = await checkUser(emailAddress, password);
    req.session.user = user;

    return res.redirect("/home");
  } catch (err) {
    console.error(err);

    if (typeof err === "string")
      return err.startsWith("VError")
        ? res.status(400).render("users/login", {
            title: "Login",
            error: `400 - ${err.substr(1)}`,
          })
        : res
            .status(400)
            .render("users/login", { title: "Login", error: `400 - ${err}` });

    return res.status(500).send("Internal Server Error");
  }
});

/**
 * @name http://localhost:3000/users/signup
 */
router.get("/signup", async (req, res) =>
  res.render("users/signup", { title: "Sign Up" })
);

/**
 * @name http://localhost:3000/users/signup
 */
router.post("/signup", async (req, res) => {
  try {
    if (!req.body) return res.status(400).send("Error: Body cannot be empty");

    let firstName = xss(req.body.firstNameInput)
    let lastName = xss(req.body.lastNameInput)
    let emailAddress = xss(req.body.emailAddressInput)
    let password = xss(req.body.passwordInput)
    let confirmPasswordInput = xss(req.body.confirmPasswordInput)
    let age = xss(req.body.ageInput)
    let userName = xss(req.body.userNameInput)

    validationsForCreateUser(
      firstName.trim(),
      lastName.trim(),
      emailAddress.trim(),
      password,
      Number(age),
      userName
    );

    if (password !== confirmPasswordInput)
      return res.status(400).render("users/signup", {
        title: "Signup",
        error: "400 - Error: Both password & confirm password should match.",
      });

    let newUser = await createUser(
      firstName,
      lastName,
      emailAddress,
      password,
      age,
      userName
    );

    if (newUser.insertedUser) return res.redirect("users/login");
  } catch (err) {
    console.error(err);

    if (typeof err === "string")
      return err.startsWith("VError")
        ? res.status(400).render("users/signup", {
            title: "Signup",
            error: `400 - ${err.substr(1)}`,
          })
        : res
            .status(400)
            .render("users/signup", { title: "Signup", error: `400 - ${err}` });

    return res.status(500).send("Internal Server Error");
  }
});

/**
 * @name http://localhost:3000/users/logout
 */
router.get("/logout", async (req, res) => {
  req.session.destroy();
  delete req.app.locals.user;
  return res.render("users/logout", { title: "logout" });
});

/**
 * @name http://localhost:3000/users/:id
 */
router
  .route("/:id")
  .get(async (req, res) => {
    let id, user;
    try {
      id = validation.checkValidId(req.params.id, "user_id");
    } catch (error) {
      return res
        .status(400)
        .render("error", { searchValue: "user", errorCode: "400" });
    }

    try {
      user = await userData.getUserById(id);
    } catch (error) {
      return res
        .status(404)
        .render("error", { searchValue: "user", errorCode: "404" });
    }

    let favLibs, ownedLibs;
    try {
      favLibs = await Promise.all(
        user.favLibraries.map(async (lib) => await libraryData.get(lib))
      );
      ownedLibs = await Promise.all(
        user.ownedLibraries.map(async (lib) => await libraryData.get(lib))
      );
      return res.status(200).render("users/user-profile", {
        favLibs: favLibs,
        ownedLibs: ownedLibs,
        searchedUser: user,
        isLoggedIn: true,
        title: "Profile",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .render("error", { searchValue: "user", errorCode: "500" });
    }
  })
  .post(async (req, res) => {
    let libId, userId;
    try {
      userId = validation.checkValidId(req.params.id, "User ID");
      libId = validation.checkValidId(req.body.libId, "Library ID");
      await userData.favoriteLibrary(userId,libId)
    } catch (error) {
      return res.status(500).render('error',
      { searchValue:"user", 
        errorCode:"500"
      })
    }
    return res.status(200).redirect(`/users/${userId}`)
  });
  
  /**
 * @name http://localhost:3000/users/edit/:id
 */
  router
  .route('/edit/:id')
  .get(async (req,res) => {
    let id, user;

    try {
      id = validation.checkValidId(req.params.id,"user_id");
      user = await userData.getUserById(id)
    } catch (error) {
      return res.status(400).render('error',
      { searchValue:"user", 
        errorCode:"400"
      })
    }

    if (req.session.user._id !== id){
      return res.status(403).render('error',{
        searchValue:"user", 
        errorCode:"403"      
      })
    }
    return res.status(200).render('users/edit-profile', {
      isLoggedIn: true,
      updateUser : user
    })
  })
  .post(async (req,res) => {
    let id, user;
    try {
      id = validation.checkValidId(req.params.id,"user_id");
      user = await userData.getUserById(id)
      if (!req.body) throw "Error: No parameters inputted";
      
      let firstName = xss(req.body.firstNameInput)
      let lastName = xss(req.body.lastNameInput)
      let emailAddress = xss(req.body.emailAddressInput)
      let password = xss(req.body.passwordInput)
      let age = xss(req.body.ageInput)
      let userName = xss(req.body.userNameInput)

      validationsForCreateUser(firstName.trim(), lastName.trim(), emailAddress.trim(), password, Number(age), userName);
      await userData.update(id, firstName, lastName, emailAddress, password, age, userName)
      return res.status(200).redirect(`/users/${id}`)

    } catch (err) {
      console.error(err);

      if (typeof err === "string") 
        return err.startsWith("VError") ? 
          res.status(400).render('users/edit-profile', { updateUser: user, isLoggedIn: true, error: `400 - ${err.substr(1)}`}) : 
          res.status(400).render('users/edit-profile', { updateUser: user, isLoggedIn: true, error: `400 - ${err}` });

      return res.status(500).send("Internal Server Error");
    }
  });
export default router;
