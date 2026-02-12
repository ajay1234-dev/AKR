const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Get Firestore instance
const db = admin.firestore();

// GET /api/bills - Get all bills
router.get("/", async (req, res) => {
  try {
    const billsSnapshot = await db
      .collection("bills")
      .orderBy("createdAt", "desc")
      .get();

    const bills = [];
    for (const doc of billsSnapshot.docs) {
      const billData = doc.data();

      // Get items for this bill
      const itemsSnapshot = await db
        .collection("billItems")
        .where("billId", "==", doc.id)
        .get();
      const items = [];
      itemsSnapshot.forEach((itemDoc) => {
        items.push({
          id: itemDoc.id,
          ...itemDoc.data(),
        });
      });

      // Get work done for this bill
      const workDoneSnapshot = await db
        .collection("workDone")
        .where("billId", "==", doc.id)
        .get();
      const workDone = [];
      workDoneSnapshot.forEach((workDoc) => {
        workDone.push({
          id: workDoc.id,
          ...workDoc.data(),
        });
      });

      // Get customer info
      let customer = null;
      if (billData.customerId) {
        const customerDoc = await db
          .collection("customers")
          .doc(billData.customerId)
          .get();
        if (customerDoc.exists) {
          customer = {
            id: customerDoc.id,
            ...customerDoc.data(),
          };
        }
      }

      bills.push({
        id: doc.id,
        ...billData,
        items,
        workDone,
        customer,
      });
    }

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
    const billDoc = await db.collection("bills").doc(id).get();

    if (!billDoc.exists) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const billData = billDoc.data();

    // Get items for this bill
    const itemsSnapshot = await db
      .collection("billItems")
      .where("billId", "==", id)
      .get();
    const items = [];
    itemsSnapshot.forEach((itemDoc) => {
      items.push({
        id: itemDoc.id,
        ...itemDoc.data(),
      });
    });

    // Get work done for this bill
    const workDoneSnapshot = await db
      .collection("workDone")
      .where("billId", "==", id)
      .get();
    const workDone = [];
    workDoneSnapshot.forEach((workDoc) => {
      workDone.push({
        id: workDoc.id,
        ...workDoc.data(),
      });
    });

    // Get customer info
    let customer = null;
    if (billData.customerId) {
      const customerDoc = await db
        .collection("customers")
        .doc(billData.customerId)
        .get();
      if (customerDoc.exists) {
        customer = {
          id: customerDoc.id,
          ...customerDoc.data(),
        };
      }
    }

    const bill = {
      id: billDoc.id,
      ...billData,
      items,
      workDone,
      customer,
    };

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
      workDone,
    } = req.body;

    // Validate required fields
    if (!customerId || !customerName || !vehicleNumber || !totalAmount) {
      return res.status(400).json({
        error:
          "Missing required fields: customerId, customerName, vehicleNumber, totalAmount",
      });
    }

    const newBill = {
      customerId,
      customerName,
      vehicleNumber,
      workDescription: workDescription || "",
      totalAmount: parseFloat(totalAmount),
      advanceAmount: parseFloat(advanceAmount) || 0,
      balanceAmount:
        parseFloat(balanceAmount) ||
        parseFloat(totalAmount) - (parseFloat(advanceAmount) || 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Create the bill
    const billRef = await db.collection("bills").add(newBill);
    const billId = billRef.id;

    // Create bill items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const batch = db.batch();

      items.forEach((item) => {
        const itemRef = db.collection("billItems").doc();
        batch.set(itemRef, {
          billId: billId,
          itemName: item.itemName,
          quantity: parseFloat(item.quantity) || 1,
          rate: parseFloat(item.rate),
          amount: parseFloat(item.amount),
          unit: item.unit || "pcs",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    }

    // Create work done entries if provided
    if (workDone && Array.isArray(workDone) && workDone.length > 0) {
      const batch = db.batch();

      workDone.forEach((work) => {
        const workRef = db.collection("workDone").doc();
        batch.set(workRef, {
          billId: billId,
          workName: work.workName,
          price: parseFloat(work.price),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    }

    // Fetch the complete bill with items and work done
    const completeBill = {
      id: billId,
      ...newBill,
    };

    // Get items for this bill
    const itemsSnapshot = await db
      .collection("billItems")
      .where("billId", "==", billId)
      .get();
    const fetchedItems = [];
    itemsSnapshot.forEach((itemDoc) => {
      fetchedItems.push({
        id: itemDoc.id,
        ...itemDoc.data(),
      });
    });
    completeBill.items = fetchedItems;

    // Get work done for this bill
    const workDoneSnapshot = await db
      .collection("workDone")
      .where("billId", "==", billId)
      .get();
    const fetchedWorkDone = [];
    workDoneSnapshot.forEach((workDoc) => {
      fetchedWorkDone.push({
        id: workDoc.id,
        ...workDoc.data(),
      });
    });
    completeBill.workDone = fetchedWorkDone;

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

    const updatedBill = {
      customerName,
      vehicleNumber,
      workDescription,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      advanceAmount:
        advanceAmount !== undefined ? parseFloat(advanceAmount) : undefined,
      balanceAmount: balanceAmount ? parseFloat(balanceAmount) : undefined,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Remove undefined values
    Object.keys(updatedBill).forEach((key) => {
      if (updatedBill[key] === undefined) {
        delete updatedBill[key];
      }
    });

    await db.collection("bills").doc(id).update(updatedBill);

    // Return updated document
    const billDoc = await db.collection("bills").doc(id).get();
    const bill = {
      id: billDoc.id,
      ...billDoc.data(),
    };

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

    // Delete bill items first
    const itemsSnapshot = await db
      .collection("billItems")
      .where("billId", "==", id)
      .get();
    const itemDeletePromises = [];
    itemsSnapshot.forEach((doc) => {
      itemDeletePromises.push(db.collection("billItems").doc(doc.id).delete());
    });

    // Delete work done entries
    const workDoneSnapshot = await db
      .collection("workDone")
      .where("billId", "==", id)
      .get();
    const workDoneDeletePromises = [];
    workDoneSnapshot.forEach((doc) => {
      workDoneDeletePromises.push(
        db.collection("workDone").doc(doc.id).delete()
      );
    });

    // Wait for related records to be deleted
    await Promise.all([...itemDeletePromises, ...workDoneDeletePromises]);

    // Finally delete the bill itself
    await db.collection("bills").doc(id).delete();

    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ error: "Failed to delete bill" });
  }
});

module.exports = router;
