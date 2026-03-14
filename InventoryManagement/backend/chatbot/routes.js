import express from "express";
import handler from "./Controller.js";

const router = express.Router();

router.post("/chat", handler);
export default router;