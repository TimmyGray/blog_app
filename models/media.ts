import { ObjectId } from "mongodb";
import { Imessage } from "./Imessage";

export class Media implements Imessage {

    constructor(
        public _id: ObjectId,
        public media: Blob) { }
}