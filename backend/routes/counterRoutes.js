import express from "express";
import {
  getCounter,
  getNextNumber,
  backfillCounters,
} from "../controller/departmentCounterController.js";

const router = express.Router();

router.get("/:departmentId", getCounter);
router.post("/:departmentId/next-number", getNextNumber);

export default router;
