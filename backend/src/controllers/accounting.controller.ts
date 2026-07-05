import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const transactions = await prisma.transaction.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createTransaction(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { userId, type, category, amount, gstAmount, paymentMethod, description } = req.body;

    if (!type || !category || !amount) {
      return res.status(400).json({ error: 'Type, category, and amount are required' });
    }

    const count = await prisma.transaction.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(3, '0')}`;

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        userId: userId || null,
        type,
        category,
        amount: parseFloat(amount),
        gstAmount: gstAmount ? parseFloat(gstAmount) : 0.0,
        invoiceNumber,
        paymentStatus: 'Completed',
        paymentMethod: paymentMethod || 'Bank Transfer',
        description
      }
    });

    return res.status(201).json(transaction);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getProfitAndLoss(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const transactions = await prisma.transaction.findMany({
      where: { tenantId }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalGST = 0;

    const incomeCategories: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === 'Income') {
        totalIncome += t.amount;
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
      } else if (t.type === 'Expense') {
        totalExpense += t.amount;
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
      }
      totalGST += t.gstAmount;
    });

    const netProfit = totalIncome - totalExpense;

    return res.status(200).json({
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        totalGST
      },
      incomeCategories,
      expenseCategories
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCommissions(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    // Fetch confirmed leads to compute college-wise and counsellor-wise commission details
    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        pipelineStage: 'Confirmed'
      },
      include: {
        counsellor: {
          select: { id: true, username: true }
        }
      }
    });

    // Also get collaborations to match with colleges
    const collabs = await prisma.collaboration.findMany({
      where: { tenantId },
      include: { college: true }
    });

    // Match college to details
    const counsellorCommissions: Record<string, { username: string; amount: number; count: number }> = {};
    const collegeCommissions: Record<string, { collegeName: string; amount: number; count: number }> = {};
    let totalPending = 0;
    let totalReceived = 0;

    // Simulate calculations
    leads.forEach(lead => {
      const matchingCollab = collabs.find(c => c.college.name === lead.preferredCollege);
      
      let commissionEarned = 10000; // default base commission per student if not matched
      if (matchingCollab) {
        if (matchingCollab.commissionPercent > 0 && lead.budget) {
          commissionEarned = (matchingCollab.commissionPercent / 100) * lead.budget;
        } else if (matchingCollab.fixedCommission > 0) {
          commissionEarned = matchingCollab.fixedCommission;
        }
      }

      // College stats
      const colName = lead.preferredCollege || 'Unknown College';
      if (!collegeCommissions[colName]) {
        collegeCommissions[colName] = { collegeName: colName, amount: 0, count: 0 };
      }
      collegeCommissions[colName].amount += commissionEarned;
      collegeCommissions[colName].count += 1;

      // Counsellor payout allocation (e.g. 10% of company commission goes to counsellor)
      if (lead.counsellor) {
        const cId = lead.counsellor.id;
        const cName = lead.counsellor.username;
        if (!counsellorCommissions[cId]) {
          counsellorCommissions[cId] = { username: cName, amount: 0, count: 0 };
        }
        counsellorCommissions[cId].amount += commissionEarned * 0.1; // 10% cut
        counsellorCommissions[cId].count += 1;
      }
      
      // Split received vs pending randomly for mock representation
      if (lead.leadScore > 90) {
        totalReceived += commissionEarned;
      } else {
        totalPending += commissionEarned;
      }
    });

    return res.status(200).json({
      summary: {
        totalEarned: totalReceived + totalPending,
        totalReceived,
        totalPending,
      },
      collegeCommissions: Object.values(collegeCommissions),
      counsellorCommissions: Object.values(counsellorCommissions)
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
