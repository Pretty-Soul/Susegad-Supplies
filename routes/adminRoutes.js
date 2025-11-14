import express from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
const router = express.Router();

// Admin login
router.post("/login", async (req,res)=>{
  try{
    const db = req.db;
    const { email, password } = req.body || {};
    if(!email || !password) return res.status(400).json({message:"Email and password required"});
    let admin = await db.collection("admins").findOne({ email });
    if(!admin) admin = await db.collection("users").findOne({ email, role: "admin" });
    if(!admin) return res.status(400).json({message:"Invalid credentials"});
    const ok = await bcrypt.compare(password, admin.password || "");
    if(!ok) return res.status(400).json({message:"Invalid credentials"});
    res.json({ message: "Admin login successful", admin: { _id: admin._id, name: admin.name || "Admin", email: admin.email } });
  }catch(err){
    console.error(err);
    res.status(500).json({message:"Server error"});
  }
});

// Admin product CRUD
router.get("/products", async (req,res)=>{
  try{
    const db = req.db;
    const list = await db.collection("products").find().sort({_id:-1}).toArray();
    res.json(list);
  }catch(e){ console.error(e); res.status(500).json({message:"Failed to fetch products"}); }
});

router.post("/products", async (req,res)=>{
  try{
    const db = req.db;
    const payload = req.body || {};
    if(!payload.name) return res.status(400).json({message:"Name required"});
    const doc = { ...payload, price: Number(payload.price||0), stock: Number(payload.stock||0), createdAt: new Date() };
    const r = await db.collection("products").insertOne(doc);
    res.json({ message: "Product added", id: r.insertedId });
  }catch(e){ console.error(e); res.status(500).json({message:"Failed to add product"}); }
});

router.put("/products/:id", async (req,res)=>{
  try{
    const db = req.db;
    const id = req.params.id;
    const update = { ...req.body };
    if(typeof update.price !== "undefined") update.price = Number(update.price);
    if(typeof update.stock !== "undefined") update.stock = Number(update.stock);
    await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: update });
    res.json({ message: "Product updated" });
  }catch(e){ console.error(e); res.status(500).json({message:"Failed to update product"}); }
});

router.delete("/products/:id", async (req,res)=>{
  try{
    const db = req.db;
    await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Product deleted" });
  }catch(e){ console.error(e); res.status(500).json({message:"Failed to delete product"}); }
});

// Users & orders
router.get("/users", async (req,res)=>{
  try{ const db = req.db; const list = await db.collection("users").find().toArray(); res.json(list); }catch(e){ console.error(e); res.status(500).json({message:"Failed to fetch users"}); }
});

router.get("/orders", async (req,res)=>{
  try{ const db = req.db; const list = await db.collection("orders").find().sort({_id:-1}).toArray(); res.json(list); }catch(e){ console.error(e); res.status(500).json({message:"Failed to fetch orders"}); }
});

export default router;
