import { Router } from "express";
import { FundController } from "../controllers";
import { isAuthed } from "../middlewares/auth";
const router = Router();

router.get("/", isAuthed, async (req, res) => {
  try {
    const data = await FundController.getFunds();
    return res.send({
      err: false,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: true, data: error.message });
  }
});

router.post("/", isAuthed, async (req, res) => {
  try {
    const data = await FundController.createFund(req.body);
    return res.send({
      err: false,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: true, data: error.message });
  }
});

export default router;
