import { Router } from "express";
import { PetController } from "../controllers";
import { isAuthed } from "../middlewares/auth";
import { response, defaultCatch } from "../utils";

const router = Router();

router.get("/:id", isAuthed, async (req, res) => {
  try {
    const { id } = req.params
    const data = await PetController.getPet(id);
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res)
  }
});

router.put("/:id", isAuthed, async (req, res) => {
  try {
    const { body, params: { id } } = req
    const data = await PetController.updatePet(id, body);
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res)
  }
});

router.delete("/:id", isAuthed, async (req, res) => {
  try {
    const { params: { id } } = req
    const data = await PetController.removePet(id);
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res)
  }
});

router.get("/", isAuthed, async (req, res) => {
  try {
    const data = await PetController.getPets();
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res)
  }
});

router.post("/", isAuthed, async (req, res) => {
  try {
    const { body } = req
    const data = await PetController.createPet(body);
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res)
  }
});

export default router;
