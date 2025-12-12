const express = require("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xbf1ip3.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const db = client.db("tcbr");
    const usersCollection = db.collection("users");
    const bookingCollection = db.collection("bookings");
    const menuCollection = db.collection('menus')

    ///users
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "user exits" });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    });
    app.post('/menus', async (req, res) => {
      const menus = req.body
      const result = await menuCollection.insertOne(menus)
      res.send(result)
    })
    app.get('/menus', async (req, res) => {
      const menus = await menuCollection.find().toArray()
      res.send(menus)
    })
    //booking post
    app.post('/bookings', async (req, res) => {
      const newBooking = req.body
      const result = await bookingCollection.insertOne(newBooking)
      console.log(result);
      res.send(result)
    })

    //booking update
    app.patch("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedBooking = req.body; // incoming updated data 
        const query = { _id: new ObjectId(id) };

        const update = {
          $set: {
            dates: updatedBooking.dates,
            roomDetails: updatedBooking.roomDetails,
            customerDetails: updatedBooking.customerDetails,
            billing: updatedBooking.billing,
          },
        };

        const result = await bookingCollection.updateOne(query, update);

        res.send(result);
      } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send({ error: "Failed to update booking" });
      }
    });

    //get booking with search and filter support
    app.get('/bookings', async (req, res) => {
      try {
        const { search, status } = req.query;

        let query = {};

        // Search filter - search by customer name or customer code
        if (search) {
          query.$or = [
            { 'customerDetails.name': { $regex: search, $options: 'i' } },
            { 'customerDetails.customerCode': { $regex: search, $options: 'i' } }
          ];
        }

        // Status filter - filter by payment status
        if (status && status !== 'All') {
          query.paymentStatus = status;
        }

        const bookings = await bookingCollection.find(query).toArray();
        res.json(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
      }
    })
    app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.findOne(query)
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

///ending code
//home port
app.get("/", (req, res) => {
  res.send("server running good");
});
//listening route
app.listen(port, () => {
  console.log("server on: " + port);
});