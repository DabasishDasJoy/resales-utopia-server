const express = require("express");
require("dotenv").config();
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, Db, ObjectId } = require("mongodb");
const verifyJwtToken = require("./middleware/verifyJwtToken");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

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
    const advertisementCollection = db.collection("advertisementCollection");
    const bookingsCollection = db.collection("bookingsCollection");
    const paymentsCollection = db.collection("paymentsCollection");

    /* ******** Database Collections ******** */

    /* ******** Middlewares ******** */
    // verify seller
    const verifySeller = async (req, res, next) => {
      const email = req.decoded.user.email;
      const query = { email: email };

      const user = await usersCollection.findOne(query);

      if (user.userType !== "Seller") {
        return res.status(403).send("Unauthorized");
      }
      next();
    };

    // verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.user.email;
      const query = { email: email };

      const user = await usersCollection.findOne(query);

      if (user.userType !== "Admin") {
        return res.status(403).send("Unauthorized");
      }
      next();
    };

    // Verify Email
    const verifyEmail = async (req, res, next) => {
      const email = req.query.email;
      if (req.decoded.user.email !== email) {
        return res.json({ message: "Unauthorized Access" });
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

      const result = await usersCollection.insertOne(user);
      res.json({ message: "success", result });
    });
    /* ******** Create user data end ******** */

    /* <=============== Get JWT Token ============> */
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
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

    app.get("/users", verifyJwtToken, verifyEmail, async (req, res) => {
      const email = req.query.email;

      const query = { email: email };

      const user = await usersCollection.findOne(query);
      // console.log("🚀 ~ file: index.js ~ line 169 ~ app.get ~ user", user);

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

    app.post(
      "/products",
      verifyJwtToken,
      verifySeller,
      verifyEmail,
      async (req, res) => {
        const email = req.query.email;

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
      }
    );
    /* <=============== Add a product end ============> */
    /* <=============== Get all products============> */
    app.get(
      "/products",
      verifyJwtToken,
      verifySeller,
      verifyEmail,
      async (req, res) => {
        const email = req.query.email;

        const query = { email: email };

        const products = await productsCollection.find(query).toArray();

        res.json({ products });
      }
    );
    /* <=============== Get all products end ============> */

    /* <=============== Delete a product ============> */
    app.delete(
      "/products/:id",
      verifyJwtToken,
      verifySeller,
      verifyEmail,
      async (req, res) => {
        const email = req.query.email;

        const query = { _id: ObjectId(req.params.id) };

        const result = await productsCollection.deleteOne(query);

        res.json({ result });
      }
    );
    /* <=============== Delete a product  end ============> */

    /* <=============== Advertise Product add ============> */
    app.post(
      "/advertise",
      verifyJwtToken,
      verifySeller,
      verifyEmail,
      async (req, res) => {
        const product = req.body;
        const result = await advertisementCollection.insertOne(product);

        res.json({ result });
      }
    );
    /* <=============== Advertise Product add ============> */

    /* <=============== Get All Categroy Specific Products  ============> */
    app.get("/products/:categoryId", async (req, res) => {
      const id = req.params.categoryId;

      const query = { _id: ObjectId(id) };

      const category = await categoriesCollection.findOne(query);
      const products = await productsCollection
        .find({
          category: category.categoryName,
        })
        .toArray();

      res.json({ products });
    });
    /* <=============== Get All sellers end ============> */
    /* <=============== Create Booking  ============> */
    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);

      res.json({ result });
    });
    /* <=============== Create Booking end ============> */

    /* <=============== Get Bookings  ============> */
    app.get("/bookings", verifyJwtToken, verifyEmail, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const bookingProducts = await bookingsCollection.find(query).toArray();

      res.json({ bookingProducts });
    });
    /* <=============== Create Booking end ============> */

    /* <=============== Get a Booking  ============> */
    app.get("/booking/:id", verifyJwtToken, verifyEmail, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const bookingProduct = await bookingsCollection.findOne(query);

      res.json({ bookingProduct });
    });
    /* <=============== Create Booking end ============> */

    /* <=============== Payment ============> */
    app.post("/create-payment-intent", async (req, res) => {
      const { sellingPrice } = req.body;
      const amount = sellingPrice * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    /* <=============== Payment end ============> */
    /* <=============== Update Booking Product end ============> */
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { productId: id };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updateBooking = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );

      const updateProduct = await productsCollection.updateOne(
        { _id: ObjectId(id) },
        updatedDoc
      );

      res.send(result);
    });
    /* <=============== Update Booking Product end ============> */

    /* <=============== Get All Buyers (Admin) ============> */
    app.get(
      "/buyers",
      verifyJwtToken,
      verifyAdmin,
      verifyEmail,
      async (req, res) => {
        const query = { userType: "Buyer" };

        const buyers = await usersCollection.find(query).toArray();

        res.json({ buyers });
      }
    );
    /* <=============== Get All Buyers (Admin) ============> */
    /* <=============== Delete Buyer (Admin) ============> */
    app.delete(
      "/buyers/:id",
      verifyJwtToken,
      verifyEmail,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;

        const query = { _id: ObjectId(id) };
        const result = await usersCollection.deleteOne(query);

        res.json({ result });
      }
    );
    /* <=============== Get All Buyer (Admin) ============> */
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
