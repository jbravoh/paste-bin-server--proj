import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// ====> ROUTES <====

// create a post

app.post("/posts", async (req, res) => {
  try {
    const { title, description } = req.body;
    const newPost = await client.query(
      "INSERT INTO posts (title, description) VALUES($1, $2) RETURNING *",
      [title, description]
    );
    res.json(newPost.rows[0]);
    res.status(201).send("Post created");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// get all posts

app.get("/posts", async (req, res) => {
  try {
    const response = await client.query("select * from posts");
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// get a post

app.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await client.query("SELECT * FROM posts WHERE id = $1", [
      id,
    ]);
    res.send(rows[0]);
    res.status(200)
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// update post

app.put("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    await client.query(
      "UPDATE posts SET title = $1, description = $2 WHERE post_id = $3",
      [title, description, id]
    );
    res.json("Post was updated");
    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// delete post

app.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await client.query("DELETE FROM posts WHERE post_id = $1", [id]);
    res.json("Post was deleted");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
