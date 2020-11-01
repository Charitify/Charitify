import { Router } from "express";
import { FundController } from "../controllers";
import { isAuthed } from "../middlewares/auth";

const router = Router();

router.get("/:id", isAuthed, async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await FundController.getFund(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.put("/:id", isAuthed, async (req, res, next) => {
  try {
    const { body, params: { id } } = req
    const data = await FundController.updateFund(id, body);
    return res.send(data);
  } catch (err) { next(err) }
});

router.delete("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await FundController.removeFund(id);
    return res.send(data);
  } catch (err) { next(err) }
});

router.get("/", isAuthed, async (req, res, next) => {
  try {
    const data = await FundController.getFunds();
    return res.send(data);
  } catch (err) { next(err) }
});

router.post("/", isAuthed, async (req, res, next) => {
  try {
    const { body } = req
    const data = await FundController.createFund(body);
    return res.send(data);
  } catch (err) { next(err) }
});

export default router;
