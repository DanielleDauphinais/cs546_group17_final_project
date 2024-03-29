import "./env.js";

import express from 'express';
const app = express();
import configRoutes from './routes/index.js';
import morgan from "morgan";
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import exphbs from 'express-handlebars';
import cookieParser from "cookie-parser";
import session from 'express-session';
import fs from 'fs';
import { sanitise } from "./middlewares/xss.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDirPath = `${__dirname}/public/uploads`;

/** If there is no uploads folder, then I am creating one */
if (!fs.existsSync(uploadsDirPath)) fs.mkdirSync(uploadsDirPath, { recursive: true });

const staticDir = express.static(__dirname + '/public');

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  // let the next middleware run:
  next();
};

app.use('/public', staticDir);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(sanitise);

app.use(
	session({
		name: 'AuthCookie',
		secret: process.env.authSecret,
		saveUninitialized: false,
		resave: false,
		cookie: { maxAge: 6000000 }
	})
);

/** 
 * This is a small middleware which will give output the 
 * summary of each request in the console, to understand
 * what's happening. TLDR; It is a logger
 */
app.use(morgan("dev"));

app.use(express.urlencoded({extended: true}));
app.use(rewriteUnsupportedBrowserMethods);
app.use(express.urlencoded({ extended: true }));
app.engine('handlebars', exphbs.engine({defaultLayout: 'main', partialsDir: ['views/partials/']}));
app.set('view engine', 'handlebars');

let hbs = exphbs.create({});

// register new function
hbs.handlebars.registerHelper({
  eq: (v1, v2) => v1 === v2,
  ne: (v1, v2) => v1 !== v2,
  lt: (v1, v2) => v1 < v2,
  gt: (v1, v2) => v1 > v2,
  lte: (v1, v2) => v1 <= v2,
  gte: (v1, v2) => v1 >= v2,
  capitalize : (str) => str.charAt(0).toUpperCase() + str.slice(1)
})

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});
