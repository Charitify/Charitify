import { Router } from "express";
import { CommentController } from "../controllers";
import { isAuthed } from "../middlewares/auth";

const router = Router();

router.get("/:id", isAuthed, async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await CommentController.getComment(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.put("/:id", isAuthed, async (req, res, next) => {
  try {
    const { body, params: { id } } = req
    const data = await CommentController.updateComment(id, body);
    return res.send(data);
  } catch (err) { next(err) }
});

router.delete("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await CommentController.removeComment(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.get("/", isAuthed, async (req, res, next) => {
  try {
    const data = await CommentController.getComments();
    return res.send(data);
  } catch (err) { next(err) }
});

router.post("/", isAuthed, async (req, res, next) => {
  try {
    const { body } = req
    const data = await CommentController.createComment(body);
    return res.send(data);
  } catch (err) { next(err) }
});

export default router;
