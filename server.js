const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  }
});

const app = express();

let corsOptions = {
   origin : ['https://face-detection-app-inky.vercel.app/', 'https://facialdetection.netlify.app/'],
}

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/', (req, res)=> { res.send("it is working")})
app.post('/signin', signin.handleSignin(db, bcrypt))
app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt) })
app.get('/profile/:id', (req, res) => { profile.handleProfileGet(req, res, db)})
app.put('/image', (req, res) => { image.handleImage(req, res, db)})
app.post('/imageurl', (req, res) => { image.handleApiCall(req, res)})

const server = app.listen(process.env.PORT || 3000, ()=> {
  const port = server.address().port;
  console.log("App is running on port " + port);
});
