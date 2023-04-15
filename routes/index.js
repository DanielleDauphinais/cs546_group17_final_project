import librariesRoutes from './libraries.js';
import userRoutes from './users.js';
import imageRouter from './image.js';
import path from 'path';
import { validate } from '../services/auth.js';
import authRouter from './auth.js';

const constructorMethod = (app) => {
  app.use("/auth", authRouter);
  
  /** 
   * Whatever routes you put above this will not be validated for authorization
   * and whatever routes you put below this has to go through authorization, so
   * you gotta login to access the resources under this
   */
  app.use(validate);

  app.use('/libraries', librariesRoutes);
  
  app.use('/users', userRoutes);
  
  app.use('/image', imageRouter);

  app.get('/about', (req, res) => {
    res.sendFile(path.resolve('static/about.html'));
  });

  app.use('*', (req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;
