import Voucher from '../models/Voucher.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class VoucherService {
  /**
   * Create a new voucher
   * @param {Object} voucherData - Voucher data
   * @returns {Promise<Object>} Created voucher
   */
  async createVoucher(voucherData) {
    const startTime = Date.now();
    logger.voucherOperation('creation started', null, {
      association: voucherData.association,
      amount: voucherData.amount,
      payee: voucherData.payee
    });

    try {
      const voucher = new Voucher(voucherData);
      const savedVoucher = await voucher.save();
      
      const duration = Date.now() - startTime;
      logger.performance('createVoucher', duration);
      logger.voucherOperation('created successfully', savedVoucher._id, {
        voucherNumber: savedVoucher.voucherNumber,
        duration: `${duration}ms`
      });

      return savedVoucher;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.performance('createVoucher', duration);
      
      if (error.name === 'ValidationError') {
        logger.error('Voucher creation failed - validation error', {
          error: error.message,
          association: voucherData.association,
          amount: voucherData.amount,
          payee: voucherData.payee
        });
        throw new AppError('Validation failed', 400, error.errors);
      }
      if (error.code === 11000) {
        logger.error('Voucher creation failed - duplicate voucher number', {
          error: error.message,
          association: voucherData.association
        });
        throw new AppError('Voucher with this voucher number already exists', 409);
      }
      
      logger.error('Voucher creation failed - unexpected error', {
        error: error.message,
        association: voucherData.association,
        amount: voucherData.amount
      });
      throw new AppError('Failed to create voucher', 500, error.message);
    }
  }

  /**
   * Get all vouchers with optional filtering and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Vouchers with pagination info
   */
  async getVouchers(filters = {}, pagination = {}) {
    const startTime = Date.now();
    logger.info('Fetching vouchers', {
      filters: Object.keys(filters).length > 0 ? filters : 'none',
      page: pagination.page || 1,
      limit: pagination.limit || 10
    });

    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      const {
        association,
        financialYear,
        status,
        payee,
        startDate,
        endDate,
        minAmount,
        maxAmount
      } = filters;

      // Build query
      const query = {};
      
      if (association) {
        query.association = new RegExp(association, 'i');
      }
      
      if (financialYear) {
        query.financialYear = financialYear;
      }
      
      if (status) {
        query.status = status;
      }
      
      if (payee) {
        query.payee = new RegExp(payee, 'i');
      }
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = Number(minAmount);
        if (maxAmount) query.amount.$lte = Number(maxAmount);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Execute query
      const [vouchers, total] = await Promise.all([
        Voucher.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Voucher.countDocuments(query)
      ]);

      const duration = Date.now() - startTime;
      logger.performance('getVouchers', duration);
      logger.info('Vouchers fetched successfully', {
        resultCount: vouchers.length,
        totalCount: total,
        page,
        limit,
        duration: `${duration}ms`
      });

      return {
        vouchers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.performance('getVouchers', duration);
      logger.error('Failed to fetch vouchers', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw new AppError('Failed to fetch vouchers', 500, error.message);
    }
  }

  /**
   * Get voucher by ID
   * @param {string} id - Voucher ID
   * @returns {Promise<Object>} Voucher
   */
  async getVoucherById(id) {
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }
      return voucher;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch voucher', 500, error.message);
    }
  }

  /**
   * Update voucher
   * @param {string} id - Voucher ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated voucher
   */
  async updateVoucher(id, updateData) {
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      if (!voucher.canEdit()) {
        throw new AppError('Voucher cannot be edited in current status', 400);
      }

      const updatedVoucher = await Voucher.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: updateData.updatedBy || 'system' },
        { new: true, runValidators: true }
      );

      return updatedVoucher;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'ValidationError') {
        throw new AppError('Validation failed', 400, error.errors);
      }
      throw new AppError('Failed to update voucher', 500, error.message);
    }
  }

  /**
   * Delete voucher
   * @param {string} id - Voucher ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteVoucher(id) {
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      if (!voucher.canDelete()) {
        throw new AppError('Voucher cannot be deleted in current status', 400);
      }

      await Voucher.findByIdAndDelete(id);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete voucher', 500, error.message);
    }
  }

  /**
   * Approve voucher
   * @param {string} id - Voucher ID
   * @param {string} approvedBy - User who approved
   * @returns {Promise<Object>} Updated voucher
   */
  async approveVoucher(id, approvedBy) {
    const startTime = Date.now();
    logger.info('Approving voucher', { voucherId: id, approvedBy });
    
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        logger.error('Voucher not found for approval', { voucherId: id });
        throw new AppError('Voucher not found', 404);
      }

      logger.info('Found voucher for approval', { 
        voucherId: id, 
        currentStatus: voucher.status,
        payee: voucher.payee
      });

      await voucher.approve(approvedBy);
      
      const duration = Date.now() - startTime;
      logger.info('Voucher approved successfully', {
        voucherId: id,
        newStatus: voucher.status,
        duration: `${duration}ms`
      });
      
      return voucher;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to approve voucher', {
        voucherId: id,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to approve voucher', 500, error.message);
    }
  }

  /**
   * Reject voucher
   * @param {string} id - Voucher ID
   * @param {string} rejectedBy - User who rejected
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated voucher
   */
  async rejectVoucher(id, rejectedBy, reason) {
    try {
      const voucher = await Voucher.findById(id);
      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      await voucher.reject(rejectedBy, reason);
      return voucher;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reject voucher', 500, error.message);
    }
  }

  /**
   * Get vouchers by financial year
   * @param {string} financialYear - Financial year
   * @returns {Promise<Array>} Vouchers
   */
  async getVouchersByFinancialYear(financialYear) {
    try {
      return await Voucher.getByFinancialYear(financialYear);
    } catch (error) {
      throw new AppError('Failed to fetch vouchers by financial year', 500, error.message);
    }
  }

  /**
   * Get vouchers by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Vouchers
   */
  async getVouchersByDateRange(startDate, endDate) {
    try {
      return await Voucher.getByDateRange(startDate, endDate);
    } catch (error) {
      throw new AppError('Failed to fetch vouchers by date range', 500, error.message);
    }
  }

  /**
   * Get voucher statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics
   */
  async getVoucherStatistics(filters = {}) {
    try {
      const { association, financialYear, startDate, endDate } = filters;
      
      const query = {};
      if (association) query.association = association;
      if (financialYear) query.financialYear = financialYear;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const stats = await Voucher.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalVouchers: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' },
            statusCounts: {
              $push: '$status'
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalVouchers: 1,
            totalAmount: 1,
            averageAmount: { $round: ['$averageAmount', 2] },
            statusBreakdown: {
              $reduce: {
                input: '$statusCounts',
                initialValue: { draft: 0, pending: 0, approved: 0, rejected: 0 },
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalVouchers: 0,
        totalAmount: 0,
        averageAmount: 0,
        statusBreakdown: { draft: 0, pending: 0, approved: 0, rejected: 0 }
      };
    } catch (error) {
      throw new AppError('Failed to fetch voucher statistics', 500, error.message);
    }
  }
}

export default new VoucherService();
