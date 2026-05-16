import { Router } from "express";
import { validate } from "../../middleware/validate"
import { CreatePostSchema } from "./post.schema";
import { createPost, listPosts } from "./post.controller";

const router = Router();

router.get("/", listPosts);
router.post("/", validate(CreatePostSchema), createPost);

export default router;