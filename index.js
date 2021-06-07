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

