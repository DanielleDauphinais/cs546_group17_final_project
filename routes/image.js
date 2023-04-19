/** @fileoverview This file contains the route & logic for uploading images to this server */

import { Router } from "express";
import multer from "multer";

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        let extension = file.originalname.split('.')[1];

        if (!extension) extension = "";
        else extension = "." + extension;
        
        return cb(null, `${Date.now()}${extension}`);
    }
});

const upload = multer({ storage });

/**
 * @name /image/upload
 * This route takes an image in the form of form data and
 * generates a unique identifier (file name under which it
 * is stored in the server), stores it in the server and 
 * then returns the metadata (fileName, link etc).
 * 
 * @example Example code for HTML form to properly upload the image
 * <form action="/profile" method="post" enctype="multipart/form-data">
 *    <input type="file" name="image" />
 * </form>
 * 
 * @example this example shows for both json and multipart form data
 * <form action="http://localhost:3000/image/upload" method="post" enctype="multipart/form-data">
 *   <input type="file" name="image" />
 *   <input type="text" name="username">
 *   <input type="submit" value="submit">
 * </form>
 */
router.post("/upload", upload.single('image'), async (req, res) => {
    try {
        console.log(req.body);
        return res.send(req.file);
    } catch (err) {
        return res.status(500).send({ status: "Error", message: "Uh, Oh! Something wrong went on our side, we will fix it soon!" });
    }
});

export default router;
