import {Router} from 'express';
const router = Router();
import {userData} from '../data/index.js';
import validation from '../validation.js';

router
  .route('/:id').get(async (req,res) => {
    try {
      var userId = validation.checkValidId(req.params.id, "User ID")
    } catch (error) {
      return res.status(404).render('error',
      { searchValue:"user", 
        errorCode:"404"
      })
    }
  });
  

export default router;
