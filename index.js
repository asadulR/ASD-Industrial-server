const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

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
    console.log('ASD Industrial server is listenning, ', port);
});

// asd-industrial
//  qMoe7lelTEGLWrAB




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjzfjki.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();

        const productCollection = client.db('asd-Industrial').collection('product');
        const buyingCardCollection = client.db('asd-Industrial').collection('selling');

        //  Generating tocken from user login
        // app.post('/login', (req, res) => {
        //     const email = req.body;
        //     const token = jwt.sign(email, process.env.TOEKEN_SECRET);
        //     // console.log(token);
        //     res.send({ token })
        // })
        //  load items from database
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });

        //  Load single item to buy
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await productCollection.findOne(query);
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
            const result = await buyingCardCollection.insertOne(myItem);
            res.send(result);
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







    }
    finally {

    }

}


run().catch(console.dir);

