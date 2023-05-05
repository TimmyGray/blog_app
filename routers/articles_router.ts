import { Router,Request } from 'express';
import multer from 'multer';
import mime from 'mime';
import { ArticlesController } from '../controllers/articles_controller.js';

const upload = multer({ dest:'media/' });

export const articlesRouter: Router = Router();
const articlesController: ArticlesController = new ArticlesController();

//articlesRouter.get('/:client/:id', articlesController.getArticle);
articlesRouter.post('/postarticle', upload.single('media'), articlesController.postArticle);
articlesRouter.put('/putarticle', upload.single('media'), articlesController.putArticle);
articlesRouter.delete('/deletearticle/:id', articlesController.deleteArticle);
articlesRouter.get('/:page', articlesController.getArticles);
