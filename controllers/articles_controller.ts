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

    async putArticle(req: Request, res: Response) {

        console.info('Edit article');

        if (!req.body) {
            console.error('Empty body');
            res.status(400).send('Empty body');
        }

        let article: Article = new Article(new Date, JSON.parse(req.body.message), req.body.username);
        const id: ObjectId = new ObjectId(req.body._id);
        const collection: Collection = req.app.locals.articlescollection;
        const bucket: GridFSBucket = req.app.locals.mediastorage;
        //await collection.findOne({ _id: id })
        //    .then(data => {
        //        if (data == null) {
        //            res.status(204).send('This article does not exist');
        //        }
        //    }).catch(e => {
        //        console.error(e);
        //        res.status(400).send('Error when check for exist');
        //    });

        if (req.file) {

            console.log('article with media');
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

            bucket.delete(new ObjectId(article.message._id))
                .catch(e => {
                    console.error(e);
                    return res.status(204).send('File not found');
                });
            const id: ObjectId = read.pipe(bucket.openUploadStream(media.originalname, { contentType: media.mimetype })).id;

            article.message = { _id: id, msgvalue: media.originalname, type: type[0] };
            console.log(id);
           

        } else {

            console.info('No file in request');
            article.message = { _id: '', msgvalue: article.message.msgvalue, type: article.message.type };

        }

        collection.findOneAndUpdate({ _id: id, }, { $set: { message: article.message } }, { returnDocument: 'after' })
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
            .then(value => {
                if (value.value.message._id != '') {
                    bucket.delete(value.value.message._id);
                }
                else {
                    console.log('File without media');
                }
            })
            .then(() => {

                console.log('successful delete');
                return res.send({message:'Succesful delete'});

            })
            .catch(e => {
                console.error(e);
                return res.status(500).send('Error when delete');
            })
       
    }

    

}