import voucherService from '../services/voucherService.js';
import { asyncHandler } from '../utils/errors.js';

/**
 * Create a new voucher
 */
export const createVoucher = asyncHandler(async (req, res) => {
  const voucherData = {
    ...req.body,
    createdBy: req.user?.id || 'system',
    updatedBy: req.user?.id || 'system'
  };

  const voucher = await voucherService.createVoucher(voucherData);
  
  res.status(201).json({
    success: true,
    message: 'Voucher created successfully',
    data: voucher
  });
});

/**
 * Get all vouchers with filtering and pagination
 */
export const getVouchers = asyncHandler(async (req, res) => {
  const filters = {
    association: req.query.association,
    financialYear: req.query.financialYear,
    status: req.query.status,
    payee: req.query.payee,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    minAmount: req.query.minAmount,
    maxAmount: req.query.maxAmount
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc'
  };

  const result = await voucherService.getVouchers(filters, pagination);
  
  res.json({
    success: true,
    message: 'Vouchers retrieved successfully',
    data: result.vouchers,
    pagination: result.pagination
  });
});

/**
 * Get voucher by ID
 */
export const getVoucherById = asyncHandler(async (req, res) => {
  const voucher = await voucherService.getVoucherById(req.params.id);
  
  res.json({
    success: true,
    message: 'Voucher retrieved successfully',
    data: voucher
  });
});

/**
 * Update voucher
 */
export const updateVoucher = asyncHandler(async (req, res) => {
  const updateData = {
    ...req.body,
    updatedBy: req.user?.id || 'system'
  };

  const voucher = await voucherService.updateVoucher(req.params.id, updateData);
  
  res.json({
    success: true,
    message: 'Voucher updated successfully',
    data: voucher
  });
});

/**
 * Delete voucher
 */
export const deleteVoucher = asyncHandler(async (req, res) => {
  await voucherService.deleteVoucher(req.params.id);
  
  res.json({
    success: true,
    message: 'Voucher deleted successfully'
  });
});

/**
 * Approve voucher
 */
export const approveVoucher = asyncHandler(async (req, res) => {
  const approvedBy = req.user?.id || req.body?.approvedBy || 'system';
  const voucher = await voucherService.approveVoucher(req.params.id, approvedBy);
  
  res.json({
    success: true,
    message: 'Voucher approved successfully',
    data: voucher
  });
});

/**
 * Reject voucher
 */
export const rejectVoucher = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const rejectedBy = req.user?.id || req.body.rejectedBy || 'system';
  const voucher = await voucherService.rejectVoucher(req.params.id, rejectedBy, reason);
  
  res.json({
    success: true,
    message: 'Voucher rejected successfully',
    data: voucher
  });
});

/**
 * Get vouchers by financial year
 */
export const getVouchersByFinancialYear = asyncHandler(async (req, res) => {
  const { financialYear } = req.params;
  const vouchers = await voucherService.getVouchersByFinancialYear(financialYear);
  
  res.json({
    success: true,
    message: 'Vouchers retrieved successfully',
    data: vouchers
  });
});

/**
 * Get vouchers by date range
 */
export const getVouchersByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const vouchers = await voucherService.getVouchersByDateRange(startDate, endDate);
  
  res.json({
    success: true,
    message: 'Vouchers retrieved successfully',
    data: vouchers
  });
});

/**
 * Get voucher statistics
 */
export const getVoucherStatistics = asyncHandler(async (req, res) => {
  const filters = {
    association: req.query.association,
    financialYear: req.query.financialYear,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const statistics = await voucherService.getVoucherStatistics(filters);
  
  res.json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: statistics
  });
});
