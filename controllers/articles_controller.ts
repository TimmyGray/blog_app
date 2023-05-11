import { Request, Response } from 'express';
import { MongoClient, Collection, ObjectId, GridFSBucket } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs, { createReadStream } from 'fs';
import { Readable } from 'stream';
import { Article } from '../models/article.js';
import { Text } from '../models/text.js';
import { Imessage } from '../models/Imessage.js';
import { Media } from '../models/media.js';
import { iscloudary } from '../app.js';
import { error } from 'console';

export class ArticlesController {

    async getArticles(req: Request, res: Response) {

        console.info('Get Articles');
       
        const collection: Collection = req.app.locals.articlescollection;
        const page = parseInt(req.params.page);
        const countonpage = 20;
        let countdocuments: number = 0;
        
        await collection.countDocuments({})
            .then(data => {

                if (data % countonpage == 0) {

                    countdocuments = data / countonpage;

                }
                else {
                    let rounddata: number = Math.round(data / countonpage);
                    if (rounddata > data / countonpage) {

                        countdocuments = rounddata;

                    } 
                    else {
                        countdocuments = rounddata + 1;
                    }

                }
            })
            .catch((e: Error) => {

                console.error(e);
                return res.status(500).send('Error when count articles');

            });

        collection.find({}).skip((page - 1) * countonpage).limit(countonpage).toArray()
            .then((data) => {

                console.log(data);
                
                return res.send({
                    articles: data,
                    counts: countdocuments
                });

            })
            .catch((e: Error) => {

                console.error(e);
                return res.status(500).send(`Error when get`);

            });
        
    }

    async getMedia(req: Request, res: Response) {

        console.info('Get Medias');
        if (!req.params) {
            console.error('Empty body');
            return res.status(400).send('Empty body');
        }

        
        const id: ObjectId = new ObjectId(req.params._id);
        console.info(id);
        
        const collection: GridFSBucket = req.app.locals.mediastorage;
        res.setHeader('accept-range', 'bytes');
        collection.openDownloadStream(id).on('data', (chank) => {
            res.write(chank);
        }).on('error', (e) => {

            console.log(e);
            res.status(404);

        }).on('end', () => {

            res.end();
        })

    }

    async postArticle(req: Request, res: Response) {

        console.info('Add Article');

        if (!req.body) {

            console.error('Empty body');
            return res.status(400);

        }

 

        let article: Article = new Article(new Date(), JSON.parse(req.body.message), req.body.username);
        const collection: Collection = req.app.locals.articlescollection;
        

        if (req.file) {

            console.info('Upload file');

            let media = req.file;
            let type = media.mimetype.split('/');
            let name = media.originalname.split('.');
            let filename='';
            for (let i = 0; i < name.length - 1; i++) {
                filename = filename + name[i];
            }
            const bucket: GridFSBucket = req.app.locals.mediastorage;
            const read = new Readable();
            read.push(media.buffer);
            read.push(null);

            const id: ObjectId = read.pipe(bucket.openUploadStream(media.originalname, { contentType: media.mimetype })).id;

            article.message = { _id: id, msgvalue: media.originalname, type: type[0] };
            console.log(id);

        }
        else {

            if (iscloudary=='0') {
                console.info('No file in request');
                article.message = { _id: '', msgvalue: article.message.msgvalue, type: article.message.type };

            }
        }

        

        let _id;

        await collection.insertOne(article)
            .then((data) => {

                console.log(data.insertedId);
                _id = data.insertedId;

            })
            .catch((e: Error) => {

                console.error(e);
                return res.status(500).send('Error when insert');

            });

        const countonpage = 20;
        let countdocuments: number = 0;

        await collection.countDocuments({})
            .then(data => {

                if (data % countonpage == 0) {

                    countdocuments = data / countonpage;

                }
                else {
                    let rounddata: number = Math.round(data / countonpage);
                    if (rounddata > data / countonpage) {

                        countdocuments = rounddata;

                    }
                    else {
                        countdocuments = rounddata + 1;
                    }

                }
            })
            .catch((e: Error) => {

                console.error(e);
                return res.status(500).send('Error when count articles');

            });

        return res.send({

            _id: _id,
            date: article.date,
            message: article.message,
            username: article.username,
            counts: countdocuments

        });

    }

    putArticle(req: Request, res: Response) {

        if (!req.body) {
            console.error('Empty body');
            res.status(400).send('Empty body');
        }

        let article: Article = new Article(new Date, JSON.parse(req.body.message), req.body.username);
        const id: ObjectId = new ObjectId(req.body._id);
        const collection: Collection = req.app.locals.articlescollection;
        const bucket: GridFSBucket = req.app.locals.mediastorage;

        if (req.file) {

            let media = req.file;
            let type = media.mimetype.split('/');
            let name = media.originalname.split('.');
            let filename = '';
            for (let i = 0; i < name.length - 1; i++) {
                filename = filename + name[i];
            }
            let read = new Readable();
            read.push(media.buffer);
            read.push(null);

            bucket.delete(article.message._id as ObjectId);
            const id: ObjectId = read.pipe(bucket.openUploadStream(filename, { contentType: media.mimetype })).id;

            article.message = { _id: id, msgvalue: media.originalname, type: type[0] };
            console.log(id);
           

        } else {

            if (iscloudary=='0') {

                console.info('No file in request');
                article.message = { _id: '', msgvalue: article.message.msgvalue, type: article.message.type };

            }

        }

        collection.findOneAndReplace({ _id: id }, article, { returnDocument: 'after' })
            .then(data => {
                console.log(data.value);
                return res.send(data.value);
            })
            .catch(e => {
                console.log(e);
                return res.status(500).send("Error when update");
            });
            
    }

    async deleteArticle(req: Request, res: Response) {

        console.info('Delete Article');

        if (!req.body) {

            console.error('Empty body');
            return res.status(400).send('Empty body');

        }

        const collection: Collection = req.app.locals.articlescollection;
        const bucket: GridFSBucket = req.app.locals.mediastorage;
        const id: ObjectId = new ObjectId(req.params._id);

        const ismedia: boolean = false;
        let article;

        collection.findOne({ _id: id })
            .then(value => {
                return article = value;
            })
            .then(value => collection.findOneAndDelete({ _id: value._id }))
            .then(value => bucket.delete(article.message._id))
            .then(() => {

                res.send('Successful delete');

            })
            .catch(e => {
                console.error(e);
                res.status(500).send('Error when delete');
            })
       
    }

    

}