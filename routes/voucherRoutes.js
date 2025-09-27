import { Router } from "express";
import {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  approveVoucher,
  rejectVoucher,
  getVouchersByFinancialYear,
  getVouchersByDateRange,
  getVoucherStatistics
} from "../controllers/voucherController.js";
import {
  validateVoucher,
  validateVoucherUpdate,
  validateId,
  validateQuery
} from "../middleware/validation.js";
// No additional rate limiting needed for simple operations

const router = Router();

// Create voucher
router.post("/", validateVoucher, createVoucher);

// Get all vouchers with filtering and pagination
router.get("/", validateQuery, getVouchers);

// Get voucher statistics
router.get("/statistics", validateQuery, getVoucherStatistics);

// Get vouchers by financial year
router.get("/financial-year/:financialYear", getVouchersByFinancialYear);

// Get vouchers by date range
router.get("/date-range", validateQuery, getVouchersByDateRange);

// Get voucher by ID
router.get("/:id", validateId, getVoucherById);

// Update voucher
router.put("/:id", validateId, validateVoucherUpdate, updateVoucher);

// Delete voucher
router.delete("/:id", validateId, deleteVoucher);

// Approve voucher
router.patch("/:id/approve", validateId, approveVoucher);

// Reject voucher
router.patch("/:id/reject", validateId, rejectVoucher);

export default router;
