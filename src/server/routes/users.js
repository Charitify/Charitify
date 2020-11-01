import { Router } from "express";
import { UserController } from "../controllers";
import { isAuthed } from "../middlewares/auth";

const router = Router();

router.get("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await UserController.getUser(id === 'me' ? '5f43e97af3c5b413ebd3e580' : id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.put("/:id", isAuthed, async (req, res, next) => {
  try {
    const { body, params: { id } } = req
    const data = await UserController.updateUser(id, body);
    return res.send(data);
  } catch (err) { next(err) }
});

router.delete("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await UserController.removeUser(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.get("/", isAuthed, async (req, res, next) => {
  try {
    const data = await UserController.getUsers();
    return res.send(data);
  } catch (err) { next(err) }
});

router.post("/", isAuthed, async (req, res, next) => {
  try {
    const { body } = req
    const data = await UserController.createUser(body);
    return res.send(data);
  } catch (err) { next(err) }
});

export default router;
