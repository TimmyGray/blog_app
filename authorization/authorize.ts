import {Request,Response } from 'express';
import path from 'path';
import jwbt from 'jsonwebtoken';
import { secrettoken} from '../app.js';

export function checkToken(req, res, next) {

    let token: string = req.body.token;
    console.info(req.body.token);
    console.info(req.headers.authorization);
    if (!token) {

        token = req.headers.authorization;
        if (!token) {

            console.error('First tier Access denied');
            return res.status(401).send('Access denied');

        }

    }

    try {

        token = token.split(' ')[0];
        console.log(token);
        if (token === 'null' || !token) {

            console.error('Second tier Access denied');
            return res.status(401).send('Access denied');

        }

        const isCorrect = jwbt.verify(token, secrettoken);
        req.user = isCorrect;

        console.info("Verified");

        next();

    } catch (e) {

        console.error(e);
        return res.status(500).send('Error when verify');

    }

}