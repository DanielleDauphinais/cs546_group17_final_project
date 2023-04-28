import {Router} from 'express';
const router = Router();
import {userData,libraryData} from '../data/index.js';
import validation from '../public/js/validators/validation.js';
import { validationsForCheckUser, validationsForCreateUser } from '../public/js/validators/user.js';

const { createUser, checkUser } = userData;
  
/** 
 * @name http://localhost:3000/users/login
 */
router.get("/login", async (req, res) => res.render('users/login', { title: "Login" }));

router.post("/login", async (req, res) => {
  try {
    if (!req.body) return res.status(400).send("Error: Email and password are required");

    let { emailAddressInput: emailAddress, passwordInput: password } = req.body;
    validationsForCheckUser(emailAddress.trim(), password.trim());

    let user = await checkUser(emailAddress, password);
    req.session.user = user;

    return res.redirect("/home"); 
  } catch (err) {
    console.error(err);

    if (typeof err === "string") 
      return err.startsWith("VError") ? 
        res.status(400).render('users/login', { title: "Login", error: `400 - ${err.substr(1)}`}) : 
        res.status(400).render('users/login', { title: "Login", error: `400 - ${err}` });

    return res.status(500).send("Internal Server Error");
  }
});

/** 
 * @name http://localhost:3000/users/signup
 */
router.get("/signup", async (req, res) => res.render('users/signup', { title: "Sign Up" }));

/** 
 * @name http://localhost:3000/users/signup
 */
router.post("/signup", async (req, res) => {
  try {
    if (!req.body) return res.status(400).send("Error: Body cannot be empty");

    let {
      firstNameInput: firstName,
      lastNameInput: lastName,
      emailAddressInput: emailAddress,
      passwordInput: password,
      confirmPasswordInput,
      ageInput: age,
      userNameInput: userName
    } = req.body;

    validationsForCreateUser(firstName.trim(), lastName.trim(), emailAddress.trim(), password, Number(age), userName);

    if (password !== confirmPasswordInput) 
      return res.status(400).render('users/signup', { title: 'Signup', error: "400 - Error: Both password & confirm password should match." });

    let newUser = await createUser(firstName, lastName, emailAddress, password, age, userName);

    if (newUser.insertedUser) return res.redirect("users/login");
  } catch (err) {
    console.error(err);

    if (typeof err === "string") 
      return err.startsWith("VError") ? 
        res.status(400).render('users/signup', { title: "Signup", error: `400 - ${err.substr(1)}`}) : 
        res.status(400).render('users/signup', { title: "Signup", error: `400 - ${err}` });

    return res.status(500).send("Internal Server Error");
  }
});

/**
 * @name http://localhost:3000/users/logout
 */
router.get('/logout', async (req, res) => {
	req.session.destroy();
  delete req.app.locals.user;
	return res.render('users/logout', { title: "logout" });
});

/**
 * @name http://localhost:3000/users/:id
 */
router
  .route('/:id').get(async (req,res) => {
    try {
      var id = validation.checkValidId(req.params.id,"user_id");
    } catch (error) {
      return res.status(400).render('error',
      { searchValue:"user", 
        errorCode:"400"
      })
    }

    try {
      var user = await userData.getUserById(id)
    } catch (error) {
      console.log(error)
      return res.status(404).render('error',
      { searchValue:"user", 
        errorCode:"404"
      })
    }

    try {
      var favLibs = await Promise.all(user.favLibraries.map(async lib => await libraryData.get(lib)))
      var ownedLibs = await Promise.all(user.ownedLibraries.map(async lib => await libraryData.get(lib)))
      return res.status(200).render('users/user-profile',
      { favLibs: favLibs,
        ownedLibs: ownedLibs 
      })
    } catch (error) {
      return res.status(500).render('error',
      { searchValue:"user", 
        errorCode:"500"
      })
    }
  });

export default router;
