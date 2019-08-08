require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
const formData = require('express-form-data');

const register = require("./controllers/register.js");
const signin = require("./controllers/signin.js");
const profile = require("./controllers/profile.js");
const image = require("./controllers/image.js");

const app = express();
app.use(bodyParser.json());
app.use(cors);
app.use(formData.parse());

const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true
	}
});

app.get('/', (req, res)=> { res.send(db.users) })

app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login')
	  .where('email', '=', req.body.email)
	  .then(data => {
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if (isValid) {
		  return db.select('*').from('users')
			.where('email', '=', req.body.email)
			.then(user => {
			  res.json(user[0])
			})
			.catch(err => res.status(400).json('unable to get user'))
		} else {
		  res.status(400).json('wrong credentials')
		}
	  })
	  .catch(err => res.status(400).json('wrong credentials'))
  })
  
  app.post('/register', (req, res) => {
	const { email, name, password } = req.body;
	const hash = bcrypt.hashSync(password);
	  db.transaction(trx => {
		trx.insert({
		  hash: hash,
		  email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
		  return trx('users')
			.returning('*')
			.insert({
			  email: loginEmail[0],
			  name: name,
			  joined: new Date()
			})
			.then(user => {
			  res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	  })
	  .catch(err => res.status(400).json('unable to register'))
  })
  
app.get('/profile/:id', (req, res) => { profile.handleProfileGet(req, res, db)})
app.put('/image', (req, res) => { image.handleImage(req, res, db)})
app.post("/imageUrl", image.handleApiCall());
app.post("/image-upload", image.handleImageUpload());

app.get("*", (req, res) => {
	res.send("sorry, nothing here((");
});

app.listen(process.env.PORT || 3000, function(){
	console.log("server starts");
});