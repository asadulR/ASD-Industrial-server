const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51L0sFbGquOMSRORH9w60g3R0DUTFrxU7tFpmgUW3JHqFCwmio60Dxcy3uQwhWyzzLXnZXSYsV4zv6amVlLvQAQCp00Z5fZh0qr');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
require('dotenv').config();
const port = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('ASD Industrial server is running');
});

app.listen(port, () => {
    console.log('ASD Industrial heroku server is listenning, ', port);
});





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjzfjki.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();

        const productCollection = client.db('asd-Industrial').collection('product');
        const buyingCardCollection = client.db('asd-Industrial').collection('selling');
        const reviewCollection = client.db('asd-Industrial').collection('reviews');
        const usersCollection = client.db('asd-Industrial').collection('users');

        //  Generating tocken from user login
        app.post('/login', (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN);
            // console.log(token);
            res.send({ token })
        })
        //  load items from database
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });
        // load reviews from database
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });

        //  Load single item to buy
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await productCollection.findOne(query);
            res.send(item);
        });

        // load single item information for payment complete
        app.get("/cardItem/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await buyingCardCollection.findOne(query);
            res.send(item);
        });

        //  updating item after buying
        app.put("/product/:id", async (req, res) => {
            const id = req.params.id;
            const updatedProductQuntity = req.body;
            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    availableQuantity: updatedProductQuntity.availableQuantity
                },
            }
            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //  updating user
        app.put("/add-user/:email", async (req, res) => {
            const email = req.params.email;
            const updateUser = req.body;
            const filter = { userEmail: email };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    user: updateUser.user
                },
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //  Inserting new item to database is protected by JWT ....  Ony Accessed email can insert an item to the database
        //  POST API for recieving inventory items from client side

        // app.post('/items', async (req, res) => {
        //     const newItem = req.body;
        //     const tokenInfo = req.headers.authoraization;
        //     const [email, accessToken] = tokenInfo?.split(" ");

        //     const decoded = verifyToken(accessToken);
        //     // console.log(decoded);
        //     if (email === decoded.email) {
        //         const result = await inventoryCollection.insertOne(newItem);

        //         res.send(result);
        //     }else{
        //         res.send({success: 'UnAuthoraized access'});
        //     }
        // });



        //  My card item
        app.post('/cardItem', async (req, res) => {
            const myItem = req.body;
            const tokenInfo = req.headers.authoraization;
            const [email, accessToken] = tokenInfo?.split(" ");
            const decoded = verifyToken(accessToken);
            if (email === decoded.email) {
                const result = await buyingCardCollection.insertOne(myItem);
                res.send(result);
            } else {
                res.send({ success: 'UnAuthoraized access' });
            }

        });

        //  Adding review to database
        app.post('/add-review', async (req, res) => {
            const review = req.body;
            const tokenInfo = req.headers.authoraization;
            const [email, accessToken] = tokenInfo?.split(" ");
            const decoded = verifyToken(accessToken);

            if (email === decoded.email) {
                const result = await reviewCollection.insertOne(review);
                res.send(result);

            } else {
                res.send({ success: 'UnAuthoraized access' });
            }

        });

        //  Get My card Item from database 

        app.get('/myitems', async (req, res) => {
            const email = req.query.email;
            // console.log(email)
            const query = { buyerEmail: email };
            const cursor = buyingCardCollection.find(query);

            const myItems = await cursor.toArray();

            res.send(myItems);

        })

        //  deleting myAdded item from MyaddedCollection database
        app.delete('/delete-myitems/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await (buyingCardCollection.deleteOne(query));
            res.send(result);
        })

        // // deleting item from inventory items collection

        // app.delete('/items/:code', async (req, res) => {
        //     const code = req.params.code;
        //     const query = { code: code };
        //     const result = await (inventoryCollection.deleteOne(query));
        //     res.send(result);
        // })

        // app.post('/create-payment-intent', async (req, res) => {
        //     const service = req.body;
        //     const price = service.price;
        //     const amount = price * 100;

        //     // Create a PaymentIntent with the order amount and currency
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: "usd",
        //         payment_method: ['card']
        //     });

        //     res.send({
        //         clientSecret: paymentIntent.client_secret,
        //     })
        // })





    }
    finally {

    }

}


run().catch(console.dir);


//  JWT verifing tocken function
function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            email = 'Invalid email'
        }
        if (decoded) {
            email = decoded
            console.log(decoded);
        }
    });

    return email;
}