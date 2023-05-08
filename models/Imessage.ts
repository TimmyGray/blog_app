import { ObjectId } from "mongodb";

export interface Imessage {

    _id: ObjectId | string,
    msgvalue: any,
    type: string

}