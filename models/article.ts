import { Imessage } from './Imessage.js';
export class Article {

    constructor(
        public date: Date,
        public message: Imessage,
        public username: string) { }

}