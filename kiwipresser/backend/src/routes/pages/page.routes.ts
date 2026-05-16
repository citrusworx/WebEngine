import { Router } from "express";
import { validate } from "../../middleware/validate"
import { CreatePageSchema } from "./page.schema";
import { getPages } from "./page.controller"

const router = Router();

router.get("/", getPages);
// router.post("", validate(CreatePageSchema), createPage);