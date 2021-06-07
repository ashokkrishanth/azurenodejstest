const express = require("express");
const app = express();
var port = process.env.PORT || 3000;
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const moment = require('moment');

app.get('/test', (req,res) => res.send('Hello kishanth Ashok Pandian'));
app.listen(port, () => console.log('Server is running on port'+port));


app.use(express.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "userId",
    secret: "subscribe",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

const db = mysql.createConnection({
  user: "unicodevserver@unicoelanserver",
  host: "unicoelanserver.mysql.database.azure.com",
  password: "P@ssword",
  database: "devtesting",
});


app.get("/login", (req, res) => {
  console.log("inside the get login");
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});


app.post("/login", (req, res) => {
  console.log("inside the post login");
  const username = req.body.username;
  const password = req.body.password;
  //console.log(username);
  console.log(password);

  var return_data = {};
  db.query("SELECT * FROM users WHERE account_email_address = ?;",username,(err, result) => 
  {
	  if (err) {res.send({ err: err });}
      //console.log(result);
		  if (result.length > 0) {
			  bcrypt.compare(password, result[0].user_password, (error, response) => {
				  if (response) 
				  {	
					  req.session.user = result;console.log("success.."+result[0].store_name);
					  return_data.store_users = result;
            res.send(return_data);
				  }else {console.log(".....wrong123 password.......");res.send({ wrongpwd: "yes" });}
			});
		  }else {console.log(".....no account.......");res.send({ noaccount: "yes"});}
     });
  });
