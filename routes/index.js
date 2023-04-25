import librariesRoutes from './libraries.js';
import userRoutes from './users.js';
import {router as imageRouter} from './image.js';
import path from 'path';

const preventLogin = (req, res, next) => (!req.session || !req.session.user) ? next() : res.redirect("/home");

const publicRoutes = ["/users/login", "/users/signup", "/about"];

const preventAccess = (req, res, next) => (!req.session || !req.session.user) ? res.redirect("/users/login") : next();

const constructorMethod = (app) => {
  app.get("/users/login", preventLogin);

  app.get("/users/signup", preventLogin);

  app.use((req, res, next) => publicRoutes.includes(req.url) ? next() : preventAccess(req, res, next));

  app.get('/about', (req, res) => {
    res.sendFile(path.resolve('static/about.html'));
  });

  app.get("/home", (req, res) => res.render("home", { isLoggedIn: true }));

  app.get('/gmaps', (req, res) => res.sendFile(path.resolve("views/gmaps.html")));

  app.use('/libraries', librariesRoutes);
  
  app.use('/users', userRoutes);
  
  app.use('/image', imageRouter);

  /** Since there is no root in our project, we gotta redirect to home page on / */
  app.get("/", (req, res) => (!req.session || !req.session.user) ? res.redirect("/users/login") : res.redirect("/home"));

  app.use('*', (req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;
