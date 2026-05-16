import { Request, Response } from "express";
import { WPRead } from "../../wp/wpread";

const wpread = new WPRead();

export const getPages = async (req: Request, res: Response) => {
    try {
        const pages = wpread.getPages({
            perPage: Number(req.query.perPage),
            page: Number(req.query.page)
            }
        )
        return res.json({
            data: pages
        });
    }
    catch(error){
        console.error("ERROR: ", error)
    }
}