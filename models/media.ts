import { ObjectId } from "mongodb";
import { Imessage } from "./Imessage.js";

export class Media implements Imessage {

    constructor(
        public _id: ObjectId,
        public msgvalue: Blob,
        public type:string) { }
}