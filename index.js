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
      try {
        const newBooking = req.body;
        
        if (newBooking.dates?.checkInDate && newBooking.dates?.checkOutDate) {
          const newIn = new Date(newBooking.dates.checkInDate);
          const newOut = new Date(newBooking.dates.checkOutDate);
          
          // Reset time to midnight for accurate day comparison
          newIn.setHours(0, 0, 0, 0);
          newOut.setHours(0, 0, 0, 0);

          const existingBookings = await bookingCollection.find().toArray();
          let isOverlapping = false;
          let isB2B = false;

          for (const booking of existingBookings) {
            if (!booking.dates?.checkInDate || !booking.dates?.checkOutDate) continue;

            const exIn = new Date(booking.dates.checkInDate);
            const exOut = new Date(booking.dates.checkOutDate);
            
            exIn.setHours(0, 0, 0, 0);
            exOut.setHours(0, 0, 0, 0);

            // Time overlap logic (strict overlap)
            const timeOverlaps = (newIn < exOut) && (newOut > exIn);
            // Back to back logic (check-in matches check-out)
            const isBackToBack = (newIn.getTime() === exOut.getTime()) || (newOut.getTime() === exIn.getTime());

            const shareRoom = newBooking.roomDetails?.some(newRoom => 
              booking.roomDetails?.some(exRoom => 
                newRoom.roomNo === exRoom.roomNo && newRoom.roomType === exRoom.roomType && newRoom.roomNo !== ""
              )
            );

            if (shareRoom) {
              if (timeOverlaps) {
                isOverlapping = true;
                break;
              }
              if (isBackToBack) {
                isB2B = true;
              }
            }
          }

          if (isOverlapping) {
            return res.status(400).send({ error: "Booking overlaps with an existing booking for the selected room(s) and Selected Date." });
          }

          if (isB2B) {
            newBooking.isB2B = true;
            newBooking.b2bText = "B2B";
          }
        }

        const result = await bookingCollection.insertOne(newBooking);
        console.log(result);
        res.send(result);
      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).send({ error: "Failed to create booking" });
      }
    });

    //booking update
    app.patch("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedBooking = req.body; // incoming updated data 
        const query = { _id: new ObjectId(id) };

        const updateData = {
          dates: updatedBooking.dates,
          roomDetails: updatedBooking.roomDetails,
          customerDetails: updatedBooking.customerDetails,
          billing: updatedBooking.billing,
        };

        if (updatedBooking.dates?.checkInDate && updatedBooking.dates?.checkOutDate) {
          const newIn = new Date(updatedBooking.dates.checkInDate);
          const newOut = new Date(updatedBooking.dates.checkOutDate);
          
          newIn.setHours(0, 0, 0, 0);
          newOut.setHours(0, 0, 0, 0);

          const existingBookings = await bookingCollection.find({ _id: { $ne: new ObjectId(id) } }).toArray();
          let isOverlapping = false;
          let isB2B = false;

          for (const booking of existingBookings) {
            if (!booking.dates?.checkInDate || !booking.dates?.checkOutDate) continue;

            const exIn = new Date(booking.dates.checkInDate);
            const exOut = new Date(booking.dates.checkOutDate);
            
            exIn.setHours(0, 0, 0, 0);
            exOut.setHours(0, 0, 0, 0);

            const timeOverlaps = (newIn < exOut) && (newOut > exIn);
            const isBackToBack = (newIn.getTime() === exOut.getTime()) || (newOut.getTime() === exIn.getTime());

            const shareRoom = updatedBooking.roomDetails?.some(newRoom => 
              booking.roomDetails?.some(exRoom => 
                newRoom.roomNo === exRoom.roomNo && newRoom.roomType === exRoom.roomType && newRoom.roomNo !== ""
              )
            );

            if (shareRoom) {
              if (timeOverlaps) {
                isOverlapping = true;
                break;
              }
              if (isBackToBack) {
                isB2B = true;
              }
            }
          }

          if (isOverlapping) {
            return res.status(400).send({ error: "Updated dates overlap with an existing booking for the selected room(s)." });
          }

          if (isB2B) {
            updateData.isB2B = true;
            updateData.b2bText = "B2B";
          } else {
            updateData.isB2B = false;
            updateData.b2bText = "";
          }
        }

        const update = {
          $set: updateData,
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

    // admin-stats endpoint
    app.get('/admin-stats', async (req, res) => {
      try {
        const bookings = await bookingCollection.find().toArray();

        // 1. Total Revenue
        const totalRevenue = bookings.reduce((sum, b) => {
          // const total = Number(b.billing?.calculations?.finalTotal) || 0;
          const total = Number(b.billing?.totalAmountInput) || 0;
          return sum + total;
        }, 0);

        // 2. Today's Bookings (based on bookingDate)
        const todayStr = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => {
            const bDate = b.dates?.bookingDate;
            return bDate && bDate.includes(todayStr);
        }).length;

        // 3. Pending Bookings (anything not 'Success')
        const pendingBookings = bookings.filter(b => b.paymentStatus !== 'Success').length;

        // 4. Total Bookings
        const totalBookings = bookings.length;

        res.json({
          totalRevenue,
          todayBookings,
          pendingBookings,
          totalBookings
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
      }
    });





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
  res.send("tcbr server running good");
});
//listening route
app.listen(port, () => {
  console.log("server on: " + port);
});