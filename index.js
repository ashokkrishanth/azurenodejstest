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


app.get('/getordersummary', function (req, res) {
  //console.log(req);
  var return_data ={};
  var data = [];
  var RFG87E10=0; var RFG93E10=0;var ULSD=0;var B5=0;var B20=0;var DEF=0; var total=0;
  var totRFG87E10=0; var totRFG93E10=0;var totULSD=0;var totB5=0;var totB20=0;var totDEF=0;
  console.log('..Inside get order summary');
  db.query("SET SESSION sql_mode=''");
  db.query('select id,delivery_number,bill_of_lading_id,max(case when (product_name="UNL 87 RFG ETH 10%") then product_name else NULL end) as "RFG87E10",max(case when (product_name="UNL 87 RFG ETH 10%") then gross_gallons else NULL end) as "UNL87GrossGallons",max(case when (product_name="PREM 93 RFG ETH 10%") then product_name else NULL end) as "RFG93E10",max(case when (product_name="PREM 93 RFG ETH 10%") then gross_gallons else NULL end) as "PREM93GrossGallons",max(case when (product_name="ULSD CLEAR TXLED") then product_name else NULL end) as "ULSD",max(case when (product_name="ULSD CLEAR TXLED") then gross_gallons else NULL end) as "ULSDGrossGallons", max(case when (product_name="B20 Biodiesel") then product_name else NULL end) as "B20",max(case when (product_name="B20 Biodiesel") then gross_gallons else NULL end) as "B20GrossGallons" from store_inventory where dealer="Elan 10" and bol_status_description="Scheduled"  group by delivery_number order by delivery_number;', function (error, schresults, fields) {
    if (error) throw error;
    
    db.query("select store_name,RFG87E10,RFG93E10,ULSD,B5,B20,DEF from price where store_name='Elan 1'", function (error, priceresults, fields) {
      if (error) throw error;
      RFG87E10=priceresults[0].RFG87E10; RFG93E10=priceresults[0].RFG93E10; ULSD=priceresults[0].ULSD;
      B5=priceresults[0].B5; B20=priceresults[0].B20; DEF=priceresults[0].DEF;
      console.log(schresults);
      var length = Object.keys(schresults).length;
      console.log("..length before..."+length);
      for (var i = 0; i < length; i++) 
      {
          total = (RFG87E10 * schresults[i].UNL87GrossGallons) + (RFG93E10 * schresults[i].PREM93GrossGallons) + (ULSD * schresults[i].ULSDGrossGallons) + (B20 * schresults[i].B20GrossGallons);
          schresults[i]['totalamount'] = total;
      }
    })
    return_data.availInventories = schresults;

    db.query("select * from price where store_name='Elan 1'", function (error, results, fields) {
      if (error) throw error;
      return_data.prices = results;
    });

    db.query("SET SESSION sql_mode=''");
    db.query('select id,delivery_number,bill_of_lading_id,max(case when (product_name="UNL 87 RFG ETH 10%") then product_name else NULL end) as "UNL 87 RFG",max(case when (product_name="UNL 87 RFG ETH 10%") then gross_gallons else NULL end) as "UNL87GrossGallons",max(case when (product_name="PREM 93 RFG ETH 10%") then product_name else NULL end) as "PREM 93 RFG",max(case when (product_name="PREM 93 RFG ETH 10%") then gross_gallons else NULL end) as "PREM93GrossGallons",max(case when (product_name="ULSD CLEAR TXLED") then product_name else NULL end) as "ULSD CLEAR TXLED",max(case when (product_name="ULSD CLEAR TXLED") then gross_gallons else NULL end) as "ULSDGrossGallons", max(case when (product_name="B20 Biodiesel") then product_name else NULL end) as "B20 Biodiesel",max(case when (product_name="B20 Biodiesel") then gross_gallons else NULL end) as "B20GrossGallons" from store_inventory where dealer="Elan 10" and bol_status_description="Out for Delivery"  group by delivery_number order by delivery_number;', function (error, intransitresults, fields) {
      if (error) throw error;
      return_data.intransit = intransitresults;
      res.send(return_data);
    });
  });
});


app.post('/getDashboardValues', function (req, res) {
  console.log("....inside the getDashboardValues ");
  //console.log(req);
  var return_data ={};
  var data = [];
  var storename = req.body.storename;
  var invRFG87E10=0, invRFG93E10=0, invULSD=0, invB5=0, invB20=0, invDEF=0;
  var transitRFG87E10=0, transitRFG93E10=0, transitULSD=0, transitB5=0, transitB20=0, transitDEF=0;
  var custRFG87E10=0, custRFG93E10=0, custULSD=0, custB5=0, custB20=0, custDEF=0;
  var summRFG87E10=0, summRFG93E10=0, summULSD=0, summB5=0, summB20=0, summDEF=0;

  var tankproduct="",tanksize=0, tankconnection=false;
  var ullageoutput = []
  var ullagearray = [];
  var ullagetest = {}
  console.log("..storename.............."+storename);
  db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Scheduled'", function (error, results, fields) {
    invRFG87E10 = results[0].RFG87E10, invRFG93E10 = results[0].RFG93E10, invULSD = results[0].ULSD, invB5 = results[0].B5, invDEF = results[0].DEF,invB20 = results[0].B20;
    if (error) throw error;
    return_data.scheduled = results;
    db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Transit'", function (error, results, fields) {
      if (error) throw error;
      return_data.transit = results;
    });
    
    db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Order'", function (error, results, fields) {
      if (error) throw error;
      custRFG87E10 = results[0].RFG87E10, custRFG93E10 = results[0].RFG93E10, custULSD = results[0].ULSD, custB5 = results[0].B5, custDEF = results[0].DEF,custB20 = results[0].B20;
      return_data.custinv = results;
      
    });
    db.query("SET SESSION sql_mode=''");
    db.query("select sum(RFG87E10) as RFG87E10,sum(RFG93E10) as RFG93E10,sum(ULSD) as ULSD,sum(B5) as B5,sum(B20) as B20,sum(DEF) as DEF from elan_cust_prod_summary where name='"+storename+"'", function (error, summaryresults, fields) {
      if (error) throw error;
      summRFG87E10= summaryresults[0].RFG87E10,summRFG93E10= summaryresults[0].RFG93E10,
      summULSD= summaryresults[0].ULSD,summB5= summaryresults[0].B5,
      summB20= summaryresults[0].B20,summDEF= summaryresults[0].DEF
      console.log("..summRFG87E10.."+summRFG87E10);
      ullagearray.push(summRFG87E10), 
      ullagearray.push(summRFG93E10), 
      ullagearray.push(summULSD), 
      ullagearray.push(summB5), 
      ullagearray.push(summB20), 
      ullagearray.push(summDEF);
      // var summRFG87E10=0, summRFG93E10=0, summULSD=0, summB5=0, summB20=0, summDEF=0;
    });
    db.query("select * from store_tanks where store_name='"+storename+"'", function (error, results, fields) {
      if (error) throw error;
      var tankconn = false;
      var length = Object.keys(results).length;
      var total=0;
      for (var i = 0; i < length; i++) 
      {
        if(results[i].tank_connection=true && i==1){
          tankconn=true;
          continue;
        }
         if (tankconn==true){
           total = results[i].tank_size - (ullagearray[i-1]);
           ullagetest[i] = total;
         }else {
           ullagetest[i] = total;
           total = results[i].tank_size - (ullagearray[i]);
         }
         ullageoutput.push(total);
      };
      tankproduct= results[0].tank_product, tankconnection= results[0].tank_connection, tanksize=results[0].tank_size
      //console.log(results);
      //console.log(".....output...."+invRFG87E10,transitRFG87E10,custRFG87E10,tankproduct,tankconnection,tanksize)
      return_data.ullage = ullageoutput;
      var deletedItem = results.splice(1,1);
       return_data.tanks = results;
      res.send(JSON.stringify(return_data));
    });
  });
 });

app.get('/storeusers', function (req, res) {
  console.log(req.checkbox);
  db.query('select * from users', function (error, results, fields) {
   if (error) throw error;
   console.log(JSON.stringify(results));
   res.end(JSON.stringify(results));
 });
});
