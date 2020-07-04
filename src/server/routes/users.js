import { Router } from "express";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const data = "";

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
