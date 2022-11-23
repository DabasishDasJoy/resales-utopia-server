const express = require("express");
require("dotenv").config();
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

console.log(process.env.DB_user);

const app = express();

/* <===============Middlewares============> */

/** MiddleWare
 * cors()
 * express.json body parser to fetch json body
 */

app.use(cors());
app.use(express.json());
/* <===============Middlewares end============> */

/* <===============Root API============> */
app.get("/", (req, res) => {
  res.json({ message: "Resales Utopia is running" });
});

app.get("/names", (req, res) => {
  res.json({ name: "Dabasish Das Joy" });
});
/* <===============Intial API end============> */
/* <===============Database============> */

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mj0nqa8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

/* <===============Database end============> */

/* <===============Server Connection============> */
app.listen(port, () => {
  client.connect((err) => {
    if (err) {
      console.log("Database ERROR: ", err);
    } else {
      console.log("Database Connected");
    }
  });
  console.log("Resales Utopia Server is running on port: ", port);
});
