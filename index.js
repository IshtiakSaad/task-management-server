require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI || "mongodb+srv://task-manager:SgTvBz5dzWFPNymf@cluster0.gkupt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let tasksCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const database = client.db("tasksDB");
    tasksCollection = database.collection("tasksCollection");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}
connectDB();

/* ----------------------- Utility Functions ----------------------- */

const validateTask = (title, description) => {
  if (!title || title.length > 50) return "Title is required (max 50 chars)";
  if (description?.length > 200) return "Description cannot exceed 200 chars";
  return null;
};

/* ----------------------- CRUD API ROUTES ----------------------- */

// Create a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description = "", category, userId } = req.body;
    const error = validateTask(title, description);
    if (error) return res.status(400).json({ error });

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const newTask = { title, description, category, userId, createdAt: new Date() };
    const result = await tasksCollection.insertOne(newTask);

    res.status(201).json({ ...newTask, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Failed to add task" });
  }
});

// Get tasks by user ID
app.get("/api/tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await tasksCollection.find({ userId }).toArray();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Update a task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const error = validateTask(title, description);
    if (error) return res.status(400).json({ error });

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, description, category } }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ error: "Task not found" });

    res.json({ _id: req.params.id, title, description, category });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Task Management API is running...");
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
