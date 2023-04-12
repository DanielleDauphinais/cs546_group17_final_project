import {Router} from 'express';
const router = Router();
import {userData,libraryData} from '../data/index.js';
import validation from '../validation.js';

router
  .route('/:id').get(async (req,res) => {
    try {
      var id = validation.checkValidId(req.params.id,"user_id");
    } catch (error) {
      return res.status(400).render('error',
      { searchValue:"user", 
        errorCode:"400"
      })
    }

    try {
      var user = await userData.getUserById(id)
    } catch (error) {
      return res.status(404).render('error',
      { searchValue:"user", 
        errorCode:"404"
      })
    }

    try {
      var favLibs = user.favLibraries.map(lib => libraryData.get(lib))
      var ownedLibs = user.ownedLibraries.map(lib => libraryData.get(lib))
      return res.status(200).render('user-profile',
      { favLibs: favLibs,
        ownedLibs: ownedLibs 
      })
    } catch (error) {
      return res.status(500).render('error',
      { searchValue:"user", 
        errorCode:"500"
      })
    }
  });
  

export default router;
