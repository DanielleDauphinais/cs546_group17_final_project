/** @fileoverview This file contains all the middleware login for authorization */

import jwt from "jsonwebtoken";

let privateKey = process.env.jwtSigningKey;

if (!privateKey) throw "Error: JWT Signing Key not found";

/**
 * This function will create an auth token for a given payload
 * @param {Object} payload 
 * @returns 
 */
const getAuthToken = payload => jwt.sign(payload, privateKey, { expiresIn: '1d' });

/**
 * This function will authorize all the requests based on auth token
 * @param {Express.req} req 
 * @param {Express.res} res 
 * @param {Express.next} next 
 */
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

/**
 * This function will handle the unauthorized requests
 * @param {Express.req} req 
 * @param {Express.res} res 
 * @param {Express.next} next 
 * @returns 
 */
const handleUnauthorizedRequest = (req, res, next) => res.status(401).json({ status: "error", message: "Unauthorized" });

export { getAuthToken, validate, handleUnauthorizedRequest };
