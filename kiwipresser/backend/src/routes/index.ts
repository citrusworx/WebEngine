import { Router } from "express";

import postsRouter from "./posts/post.routes"

const router = Router();

// router.use("/health", healthRouter);
// router.use("/charges", chargesRouter);

router.use("/posts", postsRouter);
// router.use("/pages", pagesRouter);
// router.use("/articles", articlesRouter);

export default router;