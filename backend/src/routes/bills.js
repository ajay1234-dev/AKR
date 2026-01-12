const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Create a new bill
router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      vehicleNumber,
      works,
      spareParts,
      advanceAmount = 0,
    } = req.body;

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: {
        name: customerName,
        vehicleNumber: vehicleNumber,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          vehicleNumber: vehicleNumber,
        },
      });
    }

    // Calculate total amount
    const allItems = [
      ...works.map((work) => ({
        description: work.description,
        itemType: "work",
        amount: parseFloat(work.amount),
      })),
      ...spareParts.map((part) => ({
        description: part.description,
        itemType: "sparePart",
        amount: parseFloat(part.amount),
      })),
    ];

    const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
    const balanceAmount = totalAmount - advanceAmount;

    // Generate unique bill number
    const billCount = await prisma.bill.count();
    const billNumber = `BILL-${Date.now()}-${billCount + 1}`;

    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        billNumber,
        customerId: customer.id,
        advanceAmount: parseFloat(advanceAmount),
        totalAmount,
        balanceAmount,
        billItems: {
          create: allItems,
        },
      },
      include: {
        customer: true,
        billItems: true,
      },
    });

    res.status(201).json(bill);
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

// Get all bills with customer details
router.get("/", async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        customer: true,
        billItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// Get a specific bill by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        customer: true,
        billItems: true,
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

module.exports = router;
