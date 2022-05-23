const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');



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