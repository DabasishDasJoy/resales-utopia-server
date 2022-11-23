const express = require("express");
require("dotenv").config();
const cors = require("cors");
var jwt = require("jsonwebtoken");

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

/* <===============Server Connection============> */
app.listen(port, () => {
  console.log("Resales Utopia Server is running on port: ", port);
});
