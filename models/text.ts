import { ObjectId } from "mongodb";
import { Imessage } from "./Imessage";

export class Text implements Imessage {

    constructor(
        public _id: ObjectId,
        public text: string) { }

}