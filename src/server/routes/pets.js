import { Router } from "express";
import { PetController } from "../controllers";
import { isAuthed } from "../middlewares/auth";

const router = Router();

router.get("/:id", isAuthed, async (req, res) => {
  try {
    const { id } = req.params
    const data = await PetController.getPet(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.put("/:id", isAuthed, async (req, res) => {
  try {
    const { body, params: { id } } = req
    const data = await PetController.updatePet(id, body);
    return res.send(data);
  } catch (err) { next(err) }
});

router.delete("/:id", isAuthed, async (req, res) => {
  try {
    const { params: { id } } = req
    const data = await PetController.removePet(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.get("/", isAuthed, async (req, res) => {
  try {
    const data = await PetController.getPets();
    return res.send(data);
  } catch (err) { next(err) }
});

router.post("/", isAuthed, async (req, res) => {
  try {
    const { body } = req
    const data = await PetController.createPet(body);
    return res.send(data);
  } catch (err) { next(err) }
});

export default router;
