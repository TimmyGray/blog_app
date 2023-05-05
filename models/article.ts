import { Imessage } from './Imessage.js';
export class Article {

    constructor(
        public data: Date,
        public message: Imessage,
        public username: string) { }

}