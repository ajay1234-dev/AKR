const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

// GET /api/bills - Get all bills
router.get("/", async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// GET /api/bills/:id - Get bill by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ error: "Failed to fetch bill" });
  }
});

// POST /api/bills - Create new bill
router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      vehicleNumber,
      workDescription,
      totalAmount,
      advanceAmount = 0,
      balanceAmount,
      items,
    } = req.body;

    // Validate required fields
    if (!customerId || !customerName || !vehicleNumber || !totalAmount) {
      return res.status(400).json({
        error:
          "Missing required fields: customerId, customerName, vehicleNumber, totalAmount",
      });
    }

    // Create bill with items in a transaction
    const bill = await prisma.$transaction(async (tx) => {
      // Create the bill
      const newBill = await tx.bill.create({
        data: {
          customerId,
          customerName,
          vehicleNumber,
          workDescription: workDescription || "",
          totalAmount: parseFloat(totalAmount),
          advanceAmount: parseFloat(advanceAmount) || 0,
          balanceAmount:
            parseFloat(balanceAmount) ||
            parseFloat(totalAmount) - (parseFloat(advanceAmount) || 0),
        },
      });

      // Create bill items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const billItems = items.map((item) => ({
          billId: newBill.id,
          itemName: item.itemName,
          quantity: parseInt(item.quantity) || 1,
          rate: parseFloat(item.rate),
          amount: parseFloat(item.amount),
        }));

        await tx.billItem.createMany({
          data: billItems,
        });
      }

      return newBill;
    });

    // Fetch the complete bill with items
    const completeBill = await prisma.bill.findUnique({
      where: { id: bill.id },
      include: {
        items: true,
      },
    });

    res.status(201).json(completeBill);
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

// PUT /api/bills/:id - Update bill
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      vehicleNumber,
      workDescription,
      totalAmount,
      advanceAmount,
      balanceAmount,
    } = req.body;

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        customerName,
        vehicleNumber,
        workDescription,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        advanceAmount:
          advanceAmount !== undefined ? parseFloat(advanceAmount) : undefined,
        balanceAmount: balanceAmount ? parseFloat(balanceAmount) : undefined,
      },
    });

    res.json(bill);
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

// DELETE /api/bills/:id - Delete bill
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.bill.delete({
      where: { id },
    });

    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ error: "Failed to delete bill" });
  }
});

module.exports = router;
