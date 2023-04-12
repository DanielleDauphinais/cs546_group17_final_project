/** @fileoverview This file contains all the middleware login for authorization */

import jwt from "jsonwebtoken";

let privateKey = process.env.jwtSigningKey;

const getAuthToken = payload => jwt.sign(payload, privateKey, { expiresIn: '1d' });

const validate = (req, res, next) => {
    const token = req.cookies["Auth"];

    if (!token) handleUnauthorizedRequest(req, res, next);
    try {
        /** So in every request, you can just use this object for the currently logged in user info */
        req.user = jwt.verify(token, privateKey);
        next();
    } catch (err) { 
        handleUnauthorizedRequest(req, res, next);
    }
};

const handleUnauthorizedRequest = (req, res, next) => req.url.includes("api/") ? 
                                                            res.status(401).json({ status: "error", message: "Unauthorized" }) : 
                                                            res.redirect("/"); 

export { getAuthToken, validate, handleUnauthorizedRequest };
