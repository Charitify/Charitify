import { Router } from "express";
import { DonatorController } from "../controllers";
import { isAuthed } from "../middlewares/auth";

const router = Router();

router.get("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await DonatorController.getDonator(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.put("/:id", isAuthed, async (req, res, next) => {
  try {
    const { body, params: { id } } = req
    const data = await DonatorController.updateDonator(id, body);
    return res.send(data);
  } catch (err) { next(err) }
});

router.delete("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await DonatorController.removeDonator(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.get("/", isAuthed, async (req, res, next) => {
  try {
    const { query } = req
    const data = await DonatorController.getDonators({ query });
    return res.send(data);
  } catch (err) { next(err) }
});

router.post("/", isAuthed, async (req, res, next) => {
  try {
    const { body } = req
    const data = await DonatorController.createDonator(body);
    return res.send(data);
  } catch (err) { next(err) }
});

export default router;
