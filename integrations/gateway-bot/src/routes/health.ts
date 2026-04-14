import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "teos-gateway-bot",
    status: "healthy"
  });
});

export default router;
export { router };
