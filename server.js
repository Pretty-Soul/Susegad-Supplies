import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";

const app = express();
app.use(cors({ origin: ["http://localhost:5173","http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "5mb" }));

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || "";
const DB_NAME = process.env.DB_NAME || "susegad_supplies";

if(!MONGO){
  console.error("🔴 MONGO_URI not set. Set environment variable MONGO_URI");
  process.exit(1);
}

let db;
async function connectToDB(){
  try{
    const client = new MongoClient(MONGO);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("🟢 MongoDB connected");
  }catch(e){
    console.error("🔴 MongoDB connection failed:", e);
    process.exit(1);
  }
}

app.use("/admin", (req,res,next)=> { req.db = db; next(); }, adminRoutes);
app.use("/shop", (req,res,next)=> { req.db = db; next(); }, shopRoutes);

// health
app.get("/", (req,res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

connectToDB().then(()=> {
  app.listen(PORT, ()=> console.log("Server running on port", PORT));
}).catch(err=>{
  console.error("Startup failed", err);
  process.exit(1);
});
