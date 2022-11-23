const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();

/* <===============Middlewares============> */
/** MiddleWare
 * cors()
 * express.json body parser to fetch json body
 */
app.use(cors());
app.use(express.json());
/* <===============Middlewares end============> */

/* <===============Intial API============> */
app.get("/", (req, res) => {
  res.json({ message: "Resales Utopia is running" });
});
/* <===============Intial API end============> */

app.listen(port, () => {
  console.log("Resales Utopia Server is running on port: ", port);
});
