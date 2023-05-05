import Express, { urlencoded } from 'express';
import Cors from 'cors';
import { MongoClient } from 'mongodb';
import * as mongodb from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { articlesRouter } from './routers/articles_router.js';
import { usersRouter } from './routers/users_router.js';
import { checkToken } from './authorization/authorize.js'

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const connectionstring: string = process.env.CONNECTIONS_STRINGS || process.argv[2] || "mongodb://127.0.0.1:12908";
const port = process.env.PORT || process.argv[3] || 3200;
const clienturl = process.env.CLIENT_URL || process.argv[4] || "http://localhost:4200";
export const secrettoken = process.env.SECRET_TOKEN || process.argv[5] || 'themostsecrettokenintheworld';

const mongoclient: MongoClient = new mongodb.MongoClient(connectionstring);
const app = Express();

app.use(Express.json());
app.use(Cors({
    origin: clienturl
}));

mongoclient.connect()
    .then((client: MongoClient) => {

        console.info('Connection established');
        app.locals.userscollection = client.db('blogsdb').collection('users');
        app.locals.articlescollection = client.db('blogsdb').collection('articles');
        app.locals.mediastorage = new mongodb.GridFSBucket(client.db('blogsdb'), { bucketName: 'mediastorage' });

    })
    .catch((e: Error) => {

        console.error(e);

    });


app.use(Express.static('public'));
app.use(Express.urlencoded({ extended: true }));

app.use('/users', usersRouter);
app.use('/articles', checkToken, articlesRouter);

app.get("/", checkToken,(req, res) => {

    res.sendFile('index.html', { root: path.join(__dirname, 'public') });

});

app.listen(port, () => {

    console.info(`server listen on port ${port}`);

})