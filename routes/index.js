import librariesRoutes from './libraries.js';
import userRoutes from './users.js';
import imageRouter from './image.js';
import path from 'path';

const constructorMethod = (app) => {
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
