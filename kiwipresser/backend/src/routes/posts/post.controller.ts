import { Request, Response } from "express";
import { WPRead } from "../../wp/wpread";
import { env } from "../../env";

const wpread = new WPRead();

export const createPost = (req: Request, res: Response) => {
    return res.status(201).json({
        message: "Post created",
        data: req.body
    });
};

export const listPosts = async (req: Request, res: Response) => {
  try {
    const posts = await wpread.getPosts({
      perPage: Number(req.query.perPage) || 10,
      page: Number(req.query.page) || 1,
      status: req.query.status as any,
      search: req.query.search as string
    });

    return res.json({ data: posts });
  } catch (err: any) {
    console.error("🔥 listPosts error:");
    console.error(err);
    console.error("message:", err?.message);
    console.error("stack:", err?.stack);

    return res.status(500).json({
      error: err?.message ?? "unknown error"
    });
  }
};
