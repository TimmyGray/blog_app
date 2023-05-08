import { ObjectId } from "mongodb";
import { Imessage } from "./Imessage.js";

export class Text implements Imessage {

    constructor(
        public _id: string,
        public msgvalue: string,
        public type:string) { }

}