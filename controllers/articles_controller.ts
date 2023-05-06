import { Request, Response } from 'express';
import { MongoClient, Collection, ObjectId, GridFSBucket } from 'mongodb';
import multer from 'multer';
import fs from 'fs';
import stream from 'stream';
import { Article } from '../models/article.js';
import { Text } from '../models/text.js';
import { Imessage } from '../models/Imessage.js';
import { Media } from '../models/media.js';

export class ArticlesController {

    //async countOfDocuments(collection: Collection, countonpage: number): Promise<number> {

    //    let countdocuments: number = 0;
    //    await collection.countDocuments({})
    //        .then(data => {

    //            if (data % countonpage == 0) {

    //                countdocuments = data / countonpage;

    //            }
    //            else {
    //                let rounddata: number = Math.round(data / countonpage);
    //                if (rounddata > data / countonpage) {

    //                    countdocuments = rounddata;

    //                }
    //                else {
    //                    countdocuments = rounddata + 1;
    //                }

    //            }
    //        })
    //        .catch((e: Error) => {

    //            return console.error(e);
                 

    //        });

    //    return countdocuments;
    //}

    async getArticles(req: Request, res: Response) {

        console.info('Get Articles');

        const collection: Collection = req.app.locals.articlescollection;
        const page = parseInt(req.params.page);
        const countonpage = 10;
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

        const collection: GridFSBucket = req.app.locals.mediastorage;
        const medias = await collection.find({}).toArray();
        for (let media of medias) {
            res.emit('finish');
            res.on('finish', () => {
                collection.openDownloadStream(media._id).pipe(res);
            })

        }

    }

    async postArticle(req: Request, res: Response) {

        console.info('Add Article');

        if (!req.body) {

            console.error('Empty body');
            return res.status(400).send('Empty body');

        }

        const article: Article = new Article(new Date(), null, req.body.username);
        const collection: Collection = req.app.locals.articlescollection;

        if (req.body.message) {

            console.info('No file in request');
            article.message = req.body.message;

        }

        if (req.file) {

            console.info('Upload file');

            let media = req.file;
            const bucket: GridFSBucket = req.app.locals.mediastorage;
            const read = new stream.Readable();
            read.push(media.buffer);
            const id: ObjectId = read.pipe(bucket.openUploadStream(media.filename, { contentType: media.mimetype })).id;
            
            article.message = { _id: id };
            console.log(id);

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

        const countonpage = 10;
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
            date: article.data,
            message: article.message,
            username: article.username,
            counts: countdocuments

        });

    }

    putArticle(req: Request, res: Response) {


    }

    deleteArticle(req: Request, res: Response) {


    }

    

}