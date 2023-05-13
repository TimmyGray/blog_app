import { Router, Request } from 'express';
import multer, { memoryStorage, diskStorage } from 'multer';
import mime from 'mime';
import { ArticlesController } from '../controllers/articles_controller.js';

const memorystorage = memoryStorage();
const upload = multer({ storage: memorystorage });
const upload2 = multer({ storage: diskStorage({ destination:"./" }) })

export const articlesRouter: Router = Router();
const articlesController: ArticlesController = new ArticlesController();

//articlesRouter.get('/:client/:id', articlesController.getArticle);
articlesRouter.post('/postarticle', upload.single('media'), articlesController.postArticle);
articlesRouter.put('/putarticle', upload.single('media'), articlesController.putArticle);
articlesRouter.get('/getmedia/:_id', articlesController.getMedia);
articlesRouter.delete('/deletearticle/:_id', articlesController.deleteArticle);
articlesRouter.get('/:page', articlesController.getArticles);
