const express = require("express");
const app = express();

var port = process.env.PORT || 3000;
app.get('/test', (req,res) => res.send('Hello testing123 Ashok Pandian'));
app.listen(port, () => console.log('Server is running on port'+port));
