/** @fileoverview This file contains the route layer logic for authentication */

import { Router } from "express";
import { validationsForLogin, validationsForSignUp } from "../public/js/validators/user.js";
import { isJustAString } from "../public/js/validators/util.js";
import { validate, create } from "../data/auth.js";
import { getAuthToken } from '../services/auth.js';

const router = Router();

router.get("/login", async (req, res) => res.render('auth/login'));

router.get("/signup", async (req, res) => res.render('auth/signup'));

router.post("/login", async (req, res) => {
    try {
        validationsForLogin(req.body);

        let validCredentials = await validate(req.body);

        /** If the user is authenticated then we should generate an auth token for them */
        if (!validCredentials) return res.status(401).render("auth/login", { error: "Error: Invalid Credentials" });

      res.cookie('Auth', getAuthToken(validCredentials), { httpOnly: true, secure: true });
      return res.render("home", { user: validCredentials });
    } catch (err) {
        if (isJustAString(err) && err.startsWith("VError")) return res.status(400).send(err.substr(1));

        console.dir(err, { depth: null });

		return res.status(500).send("Uh! Oh, something wrong from our side, we will fix it! :)");
    }
});

router.post("/signup", async (req, res) => {
    try {
        validationsForSignUp(req.body);

        await create(req.body);
        return res.redirect("login");
    } catch (err) {
        if (isJustAString(err) && err.startsWith("VError")) return res.status(400).send(err.substr(1));
		return res.status(500).send("Uh! Oh, something wrong from our side, we will fix it! :)");
    }
});

export default router;
