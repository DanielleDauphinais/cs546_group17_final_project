import librariesRoutes from './libraries.js';
import userRoutes from './users.js';
import imageRouter from './image.js';

const constructorMethod = (app) => {
  app.use('/libraries', librariesRoutes);
  app.use('/users', userRoutes);
  app.use('/image', imageRouter);

  app.use('*', (req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;
