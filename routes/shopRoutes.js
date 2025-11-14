import express from "express";
import { ObjectId } from "mongodb";
const router = express.Router();

router.get("/products", async (req,res)=>{
  try{
    const db = req.db;
    const list = await db.collection("products").find().sort({_id:-1}).toArray();
    res.json(list);
  }catch(e){
    console.error(e);
    res.status(500).json({message:"Failed to fetch products"});
  }
});

router.get("/categories", async (req,res)=>{
  try{
    const db = req.db;
    const list = await db.collection("categories").find().sort({name:1}).toArray();
    res.json(list);
  }catch(e){ console.error(e); res.status(500).json({message:"Failed to fetch categories"}); }
});

// Checkout: deduct stock and create order
router.post("/checkout", async (req,res)=>{
  try{
    const db = req.db;
    const { items, address, totalAmount, userEmail, paymentMethod } = req.body || {};
    if(!items || !Array.isArray(items) || items.length===0) return res.status(400).json({message:"Cart empty"});

    // validate stock
    for(const it of items){
      const qty = Number(it.quantity || it.qty || 1);
      const prod = await db.collection("products").findOne({_id: new ObjectId(it.productId)});
      if(!prod) return res.status(400).json({message:`Product not found: ${it.productId}`});
      if((prod.stock||0) < qty) return res.status(400).json({message:`${prod.name} has only ${prod.stock} in stock`});
    }

    // deduct stock
    for(const it of items){
      const qty = Number(it.quantity || it.qty || 1);
      const r = await db.collection("products").updateOne({_id: new ObjectId(it.productId), stock: {$gte: qty}}, {$inc: {stock: -qty}});
      if(r.modifiedCount === 0) return res.status(400).json({message:"Stock changed, try again"});
    }

    const order = {
      items: items.map(it=>({ productId: it.productId, productName: it.productName||"", qty: Number(it.quantity||1), price: Number(it.price||0) })),
      address: address || {},
      totalAmount: Number(totalAmount) || 0,
      userEmail: userEmail || null,
      paymentMethod: paymentMethod || "COD",
      status: "Placed",
      createdAt: new Date()
    };

    const result = await db.collection("orders").insertOne(order);
    res.json({ orderId: result.insertedId, order });

  }catch(err){
    console.error("Checkout error:", err);
    res.status(500).json({message:"Server error"});
  }
});

export default router;
