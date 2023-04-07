import express from 'express';
const app = express();
import configRoutes from './routes/index.js';
import morgan from "morgan";

app.use(express.json());
app.use(express.static('public'));

/** 
 * This is a small middleware which will give output the 
 * summary of each request in the console, to understand
 * what's happening. TLDR; It is a logger
 */
app.use(morgan("dev"));

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});
