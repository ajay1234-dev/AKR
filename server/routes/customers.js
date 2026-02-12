const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Get Firestore instance
const db = admin.firestore();

// GET /api/customers - Get all customers
router.get("/", async (req, res) => {
  try {
    const customersSnapshot = await db
      .collection("customers")
      .orderBy("createdAt", "desc")
      .get();

    const customers = [];
    customersSnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data(),
      });
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
    const customerDoc = await db.collection("customers").doc(id).get();

    if (!customerDoc.exists) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = {
      id: customerDoc.id,
      ...customerDoc.data(),
    };

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

    const newCustomer = {
      name,
      phone: phone || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("customers").add(newCustomer);
    const customer = {
      id: docRef.id,
      ...newCustomer,
    };

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

    const updatedCustomer = {
      name,
      phone: phone || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("customers").doc(id).update(updatedCustomer);

    // Return updated document
    const customerDoc = await db.collection("customers").doc(id).get();
    const customer = {
      id: customerDoc.id,
      ...customerDoc.data(),
    };

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

    await db.collection("customers").doc(id).delete();

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

module.exports = router;
