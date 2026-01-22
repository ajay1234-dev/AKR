const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();

const prisma = new PrismaClient();

// GET /api/customers - Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bills: {
          select: {
            id: true,
            vehicleNumber: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bills: {
          select: {
            id: true,
            vehicleNumber: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// POST /api/customers - Create new customer
router.post("/", async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// PUT /api/customers/:id - Update customer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id },
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

module.exports = router;
