const express = require("express");
require("dotenv").config();
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, Db, ObjectId } = require("mongodb");
const verifyJwtToken = require("./middleware/verifyJwtToken");

const port = process.env.PORT || 5000;

const app = express();

/* <=============== Middlewares ============> */

/** MiddleWare
 * cors()
 * express.json body parser to fetch json body
 */

app.use(cors());
app.use(express.json());
/* <=============== Middlewares end ============> */

/* <=============== Root API ============> */
app.get("/", (req, res) => {
  res.json({ message: "Resales Utopia is running" });
});

/* <=============== Root API end ============> */

/* <=================== Database ==================> */

/* ******** Initialization ******** */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mj0nqa8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
/* ******** Initialization end ******** */

/* ******** Build API ******** */
const run = async () => {
  try {
    /* ******** Database Collections ******** */
    const db = client.db("resales-utopia");

    const categoriesCollection = db.collection("categoriesCollection");
    const usersCollection = db.collection("usersCollection");
    const productsCollection = db.collection("productsCollection");

    /* ******** Database Collections ******** */

    /* ******** Middlewares ******** */
    const verifySeller = async (req, res, next) => {
      const email = req.decoded.user.email;
      const query = { email: email };

      const user = await usersCollection.findOne(query);
      console.log("🚀 ~ file: index.js ~ line 59 ~ verifySeller ~ user", user);

      if (user.userType !== "Seller") {
        return res.status(403).send("Unauthorized");
      }
      next();
    };
    /* ******** Middlewares ******** */

    /* ******** Get All Categories (Public) ******** */
    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();

      res.json({ message: "success", result });
    });
    /* ******** Get ALl Categories End ******** */

    /* ******** Get All Categories (NameOnly) ******** */
    app.get("/categories/names", async (req, res) => {
      const query = {};
      const result = await categoriesCollection
        .find(query)
        .project({ categoryName: 1 })
        .toArray();

      res.json({ message: "success", result });
    });
    /* ******** Get ALl Categories End ******** */

    /* ******** Get A specific Categories All data ******** */
    app.get("/categories/:id", async (req, res) => {
      /* Get the category and then category name */
      const query = { _id: ObjectId(req.params.id) };
      const category = await categoriesCollection.findOne(query);
      const categoryName = category.categoryName;

      res.json({ message: "success", categoryName });
    });
    /* ******** Get A specific Categories All data ******** */

    /* ******** Create User data(Public) ******** */
    app.post("/users", async (req, res) => {
      const user = req.body;

      //verify if user already exist in the database
      const email = user.email;
      const query = { email: email };
      const prevUser = await usersCollection.findOne(query);

      if (!prevUser) {
        const result = await usersCollection.insertOne(user);
        res.json({ message: "success", result });
      } else {
        res.json({ message: "success" });
      }
    });
    /* ******** Create user data end ******** */

    /* <=============== Get JWT Token ============> */
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        console.log("user found");
        const token = jwt.sign({ user }, process.env.JWT_TOKEN, {
          expiresIn: "1d",
        });
        return res.json({ message: "success", token: token });
      }

      return res.json({ message: "Unauthorized access" });
    });
    /* <=============== Get JWT Token end ============> */

    /* <=============== Get user type ============> */
    /**
     * Get user
     * Verify jwt token
     * Get the user type
     * return the type
     */

    app.get("/users", verifyJwtToken, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.user.email !== email) {
        res.json({ message: "Unauthorized Access" });
      }

      const query = { email: email };

      const user = await usersCollection.findOne(query);

      res.json({ userType: user.userType });
    });
    /* <=============== Get users Type end ============> */

    /* <=============== Add a product (Seller) ============> */
    /**
     * Get user
     * Verify jwt token
     * Verify Seller
     * Let to add product
     */

    app.post("/products", verifyJwtToken, verifySeller, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.user.email !== email) {
        return res.json({ message: "Unauthorized Access" });
      }

      const product = req.body;

      // Get seller
      const query = { email: email };
      const seller = await usersCollection.findOne(query);

      const doc = {
        ...product,
        seller: seller.name,
        email: email,
        verifiedSeller: seller?.verified || false,
        postedOn: new Date(),
      };

      const result = await productsCollection.insertOne(doc);

      res.json({ result });
    });
    /* <=============== Add a product end ============> */
    /* <=============== Get all products============> */
    app.get("/products", verifyJwtToken, verifySeller, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.user.email !== email) {
        return res.json({ message: "Unauthorized Access" });
      }

      const query = { email: email };

      const products = await productsCollection.find(query).toArray();

      res.json({ products });
    });
    /* <=============== Get all products end ============> */
    /* <=============== Delete a product ============> */
    app.delete(
      "/products/:id",
      verifyJwtToken,
      verifySeller,
      async (req, res) => {
        const email = req.query.email;
        if (req.decoded.user.email !== email) {
          return res.json({ message: "Unauthorized Access" });
        }

        const query = { _id: ObjectId(req.params.id) };

        const result = await productsCollection.deleteOne(query);

        res.json({ result });
      }
    );
    /* <=============== Delete a product  end ============> */
  } finally {
  }
};

run().catch(console.dir);
/* ******** Build API End ******** */

/* <=================== Database end ===============> */

/* <=============== Server Connection ============> */
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
