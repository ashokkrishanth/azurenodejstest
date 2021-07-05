const express = require("express");
const app = express();
var port = process.env.PORT || 3000;
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require('dotenv').config();
const bcrypt = require("bcrypt");
const moment = require('moment');
const nodemailer = require('nodemailer');
const log = console.log;

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



app.post('/getordersummary', function (req, res) {
  //console.log(req);
  var return_data ={};
  var storename = req.body.storename;
  var ullageoutput = {}
  var custorserialno = [];
  var ullagearray = [];
  var RFG87E10=0; var RFG93E10=0;var ULSD=0;var B5=0;var B20=0;var DEF=0; var total=0;
  var totRFG87E10=0; var totRFG93E10=0;var totULSD=0;var totB5=0;var totB20=0;var totDEF=0;
  var tanksizegrpoutput = [],tankproductgrpoutput = [];
  var custinvarray = [];custinvarrayoutput = [];
  var elaninvarray = [];elaninvarrayoutput = [];
  var elantransitarray = [];elantransitarrayoutput = [];
  var custominvarray = [];custominvarrayoutput = [];
  //console.log('..Inside get order summary');
  //console.log('..store name....'+storename);
  db.query("select * from elan_cust_prod_summary where name='"+storename+"'", function (error, results, fields) {
    var results = Object.keys(results).length;
    if (results==0){
      console.log("..there is no data available...");
      res.send({ nodata: "yes"});
    }
    else
    {
      db.query("SET SESSION sql_mode=''");
      db.query("select id,delivery_number,bill_of_lading_id,max(case when (product_name='UNL 87 RFG ETH 10%') then product_name else NULL end) as 'RFG87E10',max(case when (product_name='UNL 87 RFG ETH 10%') then gross_gallons else NULL end) as 'UNL87GrossGallons',max(case when (product_name='PREM 93 RFG ETH 10%') then product_name else NULL end) as 'RFG93E10',max(case when (product_name='PREM 93 RFG ETH 10%') then gross_gallons else NULL end) as 'PREM93GrossGallons',max(case when (product_name='ULSD CLEAR TXLED') then product_name else NULL end) as 'ULSD',max(case when (product_name='ULSD CLEAR TXLED') then gross_gallons else NULL end) as 'ULSDGrossGallons', max(case when (product_name='B20 Biodiesel') then product_name else NULL end) as 'B20',max(case when (product_name='B20 Biodiesel') then gross_gallons else NULL end) as 'B20GrossGallons' from store_inventory where dealer='"+storename+"' and bol_status_description='Scheduled'  group by delivery_number order by delivery_number", function (error, schresults, fields) {
        if (error) throw error;
        
        db.query("select store_name,RFG87E10,RFG93E10,ULSD,B5,B20,DEF from price where store_name='"+storename+"'", function (error, priceresults, fields) {
          if (error) throw error;
          if (priceresults[0].RFG87E10=='undefined'){
            RFG87E10=0;} else {RFG87E10=priceresults[0].RFG87E10; }
          
          RFG93E10=priceresults[0].RFG93E10; ULSD=priceresults[0].ULSD;
          B5=priceresults[0].B5; B20=priceresults[0].B20; DEF=priceresults[0].DEF;
          //console.log(schresults);
          var length = Object.keys(schresults).length;
          for (var i = 0; i < length; i++) 
          {
              total = (RFG87E10 * schresults[i].UNL87GrossGallons) + (RFG93E10 * schresults[i].PREM93GrossGallons) + (ULSD * schresults[i].ULSDGrossGallons) + (B20 * schresults[i].B20GrossGallons);
              schresults[i]['totalamount'] = total;
              schresults[i]['inventory'] = 'yes';
          }
        })
        return_data.availInventories = schresults;
        db.query("select * from price where store_name='"+storename+"'", function (error, results, fields) {
          if (error) throw error;
          return_data.prices = results;
        });
        db.query("SET SESSION sql_mode=''");
        db.query("select id,delivery_number,bill_of_lading_id,max(case when (product_name='UNL 87 RFG ETH 10%') then product_name else NULL end) as 'UNL 87 RFG',max(case when (product_name='UNL 87 RFG ETH 10%') then gross_gallons else NULL end) as 'UNL87GrossGallons',max(case when (product_name='PREM 93 RFG ETH 10%') then product_name else NULL end) as 'PREM 93 RFG',max(case when (product_name='PREM 93 RFG ETH 10%') then gross_gallons else NULL end) as 'PREM93GrossGallons',max(case when (product_name='ULSD CLEAR TXLED') then product_name else NULL end) as 'ULSD CLEAR TXLED',max(case when (product_name='ULSD CLEAR TXLED') then gross_gallons else NULL end) as 'ULSDGrossGallons', max(case when (product_name='B20 Biodiesel') then product_name else NULL end) as 'B20 Biodiesel',max(case when (product_name='B20 Biodiesel') then gross_gallons else NULL end) as 'B20GrossGallons' from store_inventory where dealer='"+storename+"' and bol_status_description='Out for Delivery'  group by delivery_number order by delivery_number", function (error, intransitresults, fields) {
          if (error) throw error;
          db.query("select store_name,RFG87E10,RFG93E10,ULSD,B5,B20,DEF from price where store_name='"+storename+"'", function (error, priceresults, fields) {
            if (error) throw error;
              if (priceresults[0].RFG87E10=='undefined'){
                RFG87E10=0;} else {RFG87E10=priceresults[0].RFG87E10; }
              
              RFG93E10=priceresults[0].RFG93E10; ULSD=priceresults[0].ULSD;
              B5=priceresults[0].B5; B20=priceresults[0].B20; DEF=priceresults[0].DEF;
              //console.log(schresults);
              var length = Object.keys(intransitresults).length;
              for (var i = 0; i < length; i++) 
              {
                  total = (RFG87E10 * intransitresults[i].UNL87GrossGallons) + (RFG93E10 * intransitresults[i].PREM93GrossGallons) + (ULSD * intransitresults[i].ULSDGrossGallons) + (B20 * intransitresults[i].B20GrossGallons);
                  intransitresults[i]['totalamount'] = total;
                  intransitresults[i]['inventory'] = 'no';
              }
            })
          return_data.intransit = intransitresults;
          //console.log(return_data);
        });
        db.query("SET SESSION sql_mode=''");
        db.query("select sum(RFG87E10) as RFG87E10,sum(RFG93E10) as RFG93E10,sum(ULSD) as ULSD,sum(B5) as B5,sum(B20) as B20,sum(DEF) as DEF from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit!='Custom'", function (error, summaryresults, fields) {
          if (error) throw error;
          summRFG87E10= summaryresults[0].RFG87E10,summRFG93E10= summaryresults[0].RFG93E10,
          summULSD= summaryresults[0].ULSD,summB5= summaryresults[0].B5,
          summB20= summaryresults[0].B20,summDEF= summaryresults[0].DEF
          //console.log("..insdie the summay function.....");
          ullagearray.push(summRFG87E10), 
          ullagearray.push(summRFG93E10), 
          ullagearray.push(summULSD), 
          ullagearray.push(summB5), 
          ullagearray.push(summB20), 
          ullagearray.push(summDEF);
          // var summRFG87E10=0, summRFG93E10=0, summULSD=0, summB5=0, summB20=0, summDEF=0;

          var date_format = new Date();
          var shortYear = date_format.getFullYear();
          var twoDigitYear = shortYear.toString().substr(-2);
          var getdate =  "CO"+twoDigitYear+''+('0' + (date_format.getMonth()+1)).slice(-2)+''+('0' + (date_format.getDate())).slice(-2)

          console.log("....date value....."+getdate)
          db.query("select count(*) as count from orders_placement where store_name='"+storename+"' and substring(delivery_number,1,8)='"+getdate+"' ", function (error, custorderresults, fields) {
            if (error) throw error;
            custorserialno.push(custorderresults[0].count)
          }) 

          db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Scheduled'", function (error, results, fields) {
            elaninvarray.push(results[0].RFG87E10);
            elaninvarray.push(results[0].RFG93E10);
            elaninvarray.push(results[0].ULSD);
            elaninvarray.push(results[0].B5);
            elaninvarray.push(results[0].B20);
            elaninvarray.push(results[0].DEF);
            //console.log(elaninvarray);
          if (error) throw error;
  
          db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Transit'", function (error, results, fields) {
            elantransitarray.push(results[0].RFG87E10);
            elantransitarray.push(results[0].RFG93E10);
            elantransitarray.push(results[0].ULSD);
            elantransitarray.push(results[0].B5);
            elantransitarray.push(results[0].B20);
            elantransitarray.push(results[0].DEF);
            if (error) throw error;
          });
          
          db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Order'", function (error, results, fields) {
            if (error) throw error;
            custinvarray.push(results[0].RFG87E10);
            custinvarray.push(results[0].RFG93E10);
            custinvarray.push(results[0].ULSD);
            custinvarray.push(results[0].B5);
            custinvarray.push(results[0].B20);
            custinvarray.push(results[0].DEF);
            return_data.custinv = results;
          });
          db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Custom'", function (error, results, fields) {
            if (error) throw error;
            custominvarray.push(results[0].RFG87E10);
            custominvarray.push(results[0].RFG93E10);
            custominvarray.push(results[0].ULSD);
            custominvarray.push(results[0].B5);
            custominvarray.push(results[0].B20);
            custominvarray.push(results[0].DEF);
            return_data.custominv = results;
          });
          db.query("SET SESSION sql_mode=''");
          db.query("select sum(RFG87E10) as RFG87E10,sum(RFG93E10) as RFG93E10,sum(ULSD) as ULSD,sum(B5) as B5,sum(B20) as B20,sum(DEF) as DEF from elan_cust_prod_summary where name='"+storename+"'", function (error, summaryresults, fields) {
            if (error) throw error;
            summRFG87E10= summaryresults[0].RFG87E10,summRFG93E10= summaryresults[0].RFG93E10,
            summULSD= summaryresults[0].ULSD,summB5= summaryresults[0].B5,
            summB20= summaryresults[0].B20,summDEF= summaryresults[0].DEF
            ullagearray.push(summRFG87E10), 
            ullagearray.push(summRFG93E10), 
            ullagearray.push(summULSD), 
            ullagearray.push(summB5), 
            ullagearray.push(summB20), 
            ullagearray.push(summDEF);
          });
          var gocount=0;
          db.query("SET SESSION sql_mode=''");
          db.query("select tank_number,tank_product,sum(values_from_inv_readings) as invreadings, sum(tank_size) as tanksize, count(tank_product) as totalproduct FROM store_tanks where store_name='"+storename+"'  group by tank_product having count(tank_product)>0", function (error, groupresults, fields) {
            if (error) throw error;
          
            var grplength = Object.keys(groupresults).length;
            for (var i = 0; i < grplength; i++) 
            {
              tanksizegrpoutput.push(groupresults[i].tanksize);
              if(groupresults[i].tank_product=='RFG87E10'){
                elaninvarrayoutput.push(elaninvarray[0]); 
                elantransitarrayoutput.push(elantransitarray[0]);
                custominvarrayoutput.push(custominvarray[0]); 
                custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[0]) + custinvarray[0] + custominvarray[0]));
                total = groupresults[i].tanksize - (elaninvarray[0]+elantransitarray[0]+((groupresults[i].invreadings - ullagearray[0]) + custinvarray[0] + custominvarray[0]));
                ullageoutput.item1 = total;
              }
              if(groupresults[i].tank_product=='RFG93E10'){
                elaninvarrayoutput.push(elaninvarray[1]); 
                elantransitarrayoutput.push(elantransitarray[1]);
                custominvarrayoutput.push(custominvarray[1]); 
                custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[1]) + custinvarray[1] + custominvarray[1]));
                total = groupresults[i].tanksize - (elaninvarray[1]+elantransitarray[1]+((groupresults[i].invreadings - ullagearray[1]) + custinvarray[1] + custominvarray[1]));
                ullageoutput.item2 = total;
              }
              if(groupresults[i].tank_product=='ULSD'){
                elaninvarrayoutput.push(elaninvarray[2]); 
                elantransitarrayoutput.push(elantransitarray[2]);
                custominvarrayoutput.push(custominvarray[2]); 
                custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[2]) + custinvarray[2] + custominvarray[2]));
                total = groupresults[i].tanksize - (elaninvarray[2]+elantransitarray[2]+((groupresults[i].invreadings - ullagearray[2]) + custinvarray[2] + custominvarray[2]));
                ullageoutput.item3 = total;
              }
              if(groupresults[i].tank_product=='B5'){
                elaninvarrayoutput.push(elaninvarray[3]); 
                elantransitarrayoutput.push(elantransitarray[3]);
                custominvarrayoutput.push(custominvarray[3]);
                custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[3]) + custinvarray[3] + custominvarray[3]));
                total = groupresults[i].tanksize - (elaninvarray[3]+elantransitarray[3]+((groupresults[i].invreadings - ullagearray[3]) + custinvarray[3] + custominvarray[3]));
                ullageoutput.item4 = total;
              }
              if(groupresults[i].tank_product=='B20'){
                elaninvarrayoutput.push(elaninvarray[4]); 
                elantransitarrayoutput.push(elantransitarray[4]);
                custominvarrayoutput.push(custominvarray[4]);
                custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[4]) + custinvarray[4] + custominvarray[4]));
                total = groupresults[i].tanksize - (elaninvarray[4]+elantransitarray[4]+((groupresults[i].invreadings - ullagearray[4]) + custinvarray[4] + custominvarray[4]));
                ullageoutput.item5 = total;
              }
              if(groupresults[i].tank_product=='DEF'){
                elaninvarrayoutput.push(elaninvarray[5]); 
                elantransitarrayoutput.push(elantransitarray[5]);
                custominvarrayoutput.push(custominvarray[5]);
                custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[5]) + custinvarray[5] + custominvarray[5]));
                total = groupresults[i].tanksize - (elaninvarrayoutput[0]+elantransitarrayoutput[0]+custinvarrayoutput[0]);
                ullageoutput.item6 = total;
              }
            }
          });
  
          db.query("select * from store_tanks where store_name='"+storename+"'", function (error, results, fields) {
            if (error) throw error;    
            return_data.ullage = ullageoutput;
            return_data.cuorderserialno = custorserialno;
            res.send(JSON.stringify(return_data));
          });
        }); 
        });

      });
    }
  });
});

app.post('/getDashboardValues', function (req, res) {
  console.log("....inside the getDashboardValues ");
  //console.log(req);
  var return_data ={};
  var storename = req.body.storename;
  var summRFG87E10=0, summRFG93E10=0, summULSD=0, summB5=0, summB20=0, summDEF=0;
  var ullageoutput = [],ullagearray = [],tanknumbergrpoutput = [];
  var tanksizegrpoutput = [],tankproductgrpoutput = [];
  var custinvarray = [];custinvarrayoutput = [];
  var elaninvarray = [];elaninvarrayoutput = [];
  var elantransitarray = [];elantransitarrayoutput = [];
  var custominvarray = [];custominvarrayoutput = [];
  //console.log("..storename.............."+storename);
  db.query("select tank_number,values_from_inv_readings,tank_product FROM store_tanks where store_name='"+storename+"'", function (error, tankresults, fields) {
    if (error) throw error;

  });

  db.query("select * from elan_cust_prod_summary where name='"+storename+"'", function (error, results, fields) {
    var results = Object.keys(results).length;
    if (results==0){
      console.log("..there is no data available...");
      res.send({ nodata: "yes"});
    }
    else
    {
      db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Scheduled'", function (error, results, fields) {
          elaninvarray.push(results[0].RFG87E10);
          elaninvarray.push(results[0].RFG93E10);
          elaninvarray.push(results[0].ULSD);
          elaninvarray.push(results[0].B5);
          elaninvarray.push(results[0].B20);
          elaninvarray.push(results[0].DEF);
          //console.log(elaninvarray);
        if (error) throw error;

        db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Transit'", function (error, results, fields) {
          elantransitarray.push(results[0].RFG87E10);
          elantransitarray.push(results[0].RFG93E10);
          elantransitarray.push(results[0].ULSD);
          elantransitarray.push(results[0].B5);
          elantransitarray.push(results[0].B20);
          elantransitarray.push(results[0].DEF);
          if (error) throw error;
        });
        
        db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Order'", function (error, results, fields) {
          if (error) throw error;
          custinvarray.push(results[0].RFG87E10);
          custinvarray.push(results[0].RFG93E10);
          custinvarray.push(results[0].ULSD);
          custinvarray.push(results[0].B5);
          custinvarray.push(results[0].B20);
          custinvarray.push(results[0].DEF);
          return_data.custinv = results;
        });
        db.query("select * from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit='Custom'", function (error, results, fields) {
          if (error) throw error;
          custominvarray.push(results[0].RFG87E10);
          custominvarray.push(results[0].RFG93E10);
          custominvarray.push(results[0].ULSD);
          custominvarray.push(results[0].B5);
          custominvarray.push(results[0].B20);
          custominvarray.push(results[0].DEF);
          return_data.custominv = results;
        });
        db.query("SET SESSION sql_mode=''");
        db.query("select sum(RFG87E10) as RFG87E10,sum(RFG93E10) as RFG93E10,sum(ULSD) as ULSD,sum(B5) as B5,sum(B20) as B20,sum(DEF) as DEF from elan_cust_prod_summary where name='"+storename+"' and sheduled_or_transit!='Custom'", function (error, summaryresults, fields) {
          if (error) throw error;
          summRFG87E10= summaryresults[0].RFG87E10,summRFG93E10= summaryresults[0].RFG93E10,
          summULSD= summaryresults[0].ULSD,summB5= summaryresults[0].B5,
          summB20= summaryresults[0].B20,summDEF= summaryresults[0].DEF
          ullagearray.push(summRFG87E10), 
          ullagearray.push(summRFG93E10), 
          ullagearray.push(summULSD), 
          ullagearray.push(summB5), 
          ullagearray.push(summB20), 
          ullagearray.push(summDEF);
        });
        var gocount=0;
        db.query("SET SESSION sql_mode=''");
        db.query("select tank_number,tank_product,sum(values_from_inv_readings) as invreadings, sum(tank_size) as tanksize, count(tank_product) as totalproduct FROM store_tanks where store_name='"+storename+"'  group by tank_product having count(tank_product)>0", function (error, groupresults, fields) {
          if (error) throw error;
        
          var grplength = Object.keys(groupresults).length;
          for (var i = 0; i < grplength; i++) 
          {
            if (groupresults[i].totalproduct>1){
              gocount = gocount + 1;
              tanknumbergrpoutput.push("Tank "+groupresults[i].tank_number + "-G0"+gocount);
            }
            else {
              tanknumbergrpoutput.push("Tank "+groupresults[i].tank_number);
            }
            tankproductgrpoutput.push(groupresults[i].tank_product);

            tanksizegrpoutput.push(groupresults[i].tanksize);


            if(groupresults[i].tank_product=='RFG87E10'){
              elaninvarrayoutput.push(elaninvarray[0]); 
              elantransitarrayoutput.push(elantransitarray[0]);
              //console.log("....custom inventory values....."+custominvarray[0]);
              //console.log("....cust inventory values....."+custinvarray[0]);
              //console.log(".... ullagearray values....."+ullagearray[0]);
              //console.log("....subtract values....."+(groupresults[i].invreadings - ullagearray[0]));
              custominvarrayoutput.push(custominvarray[0]); 
              custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[0]) + custinvarray[0] + custominvarray[0]));
              total = groupresults[i].tanksize - (elaninvarray[0]+elantransitarray[0]+((groupresults[i].invreadings - ullagearray[0]) + custinvarray[0] + custominvarray[0]));
              ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='RFG93E10'){
              console.log("...inside .RFG93E10.....");
              elaninvarrayoutput.push(elaninvarray[1]); 
              elantransitarrayoutput.push(elantransitarray[1]);
              custominvarrayoutput.push(custominvarray[1]); 
              custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[1]) + custinvarray[1] + custominvarray[1]));
              total = groupresults[i].tanksize - (elaninvarray[1]+elantransitarray[1]+((groupresults[i].invreadings - ullagearray[1]) + custinvarray[1] + custominvarray[1]));
              ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='ULSD'){
              console.log("...inside .ULSD....");
              elaninvarrayoutput.push(elaninvarray[2]); 
              elantransitarrayoutput.push(elantransitarray[2]);
              custominvarrayoutput.push(custominvarray[2]); 
              custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[2]) + custinvarray[2] + custominvarray[2]));
              total = groupresults[i].tanksize - (elaninvarray[2]+elantransitarray[2]+((groupresults[i].invreadings - ullagearray[2]) + custinvarray[2] + custominvarray[2]));
              ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='B5'){
              elaninvarrayoutput.push(elaninvarray[3]); 
              elantransitarrayoutput.push(elantransitarray[3]);
              custominvarrayoutput.push(custominvarray[3]);
              custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[3]) + custinvarray[3] + custominvarray[3]));
              total = groupresults[i].tanksize - (elaninvarray[3]+elantransitarray[3]+((groupresults[i].invreadings - ullagearray[3]) + custinvarray[3] + custominvarray[3]));
              ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='B20'){
              elaninvarrayoutput.push(elaninvarray[4]); 
              elantransitarrayoutput.push(elantransitarray[4]);
              custominvarrayoutput.push(custominvarray[4]);
              console.log("...B20....");
              console.log("....elaninvarray values....."+elaninvarray[4]);
              console.log("....elantransitarray values....."+elantransitarray[4]);
              console.log(".... custominvarray values....."+custominvarray[4]);
              console.log("....custinvarrayoutput values....."+((groupresults[i].invreadings - ullagearray[4]) + custinvarray[4] + custominvarray[4]));

              custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[4]) + custinvarray[4] + custominvarray[4]));
              total = groupresults[i].tanksize - (elaninvarray[4]+elantransitarray[4]+((groupresults[i].invreadings - ullagearray[4]) + custinvarray[4] + custominvarray[4]));
              ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='DEF'){
              
              elaninvarrayoutput.push(elaninvarray[5]); 
              elantransitarrayoutput.push(elantransitarray[5]);
              custominvarrayoutput.push(custominvarray[5]);
              custinvarrayoutput.push(((groupresults[i].invreadings - ullagearray[5]) + custinvarray[5] + custominvarray[5]));
              total = groupresults[i].tanksize - (elaninvarrayoutput[0]+elantransitarrayoutput[0]+custinvarrayoutput[0]);
              ullageoutput.push(total);
            }
          }
        });

        db.query("select * from store_tanks where store_name='"+storename+"'", function (error, results, fields) {
          if (error) throw error;    
          var tankconn = false;
          var length = Object.keys(results).length;
          var total=0;k=-1;
          for (var i = 0; i < length; i++) 
          {
            k = k + 1;
            if(results[i].tank_connection=true){
              tankconn=true;
              continue;
            }
          };
          tankproduct= results[0].tank_product, tankconnection= results[0].tank_connection, tanksize=results[0].tank_size
          return_data.tanknumbergrp = tanknumbergrpoutput;
          return_data.tanksizegrp = tanksizegrpoutput;
          return_data.tankproductgrp = tankproductgrpoutput;
          return_data.custinvarray = custinvarrayoutput;
          return_data.elantransitarray = elantransitarrayoutput;
          return_data.elaninvarray = elaninvarrayoutput;
          return_data.ullage = ullageoutput;
          return_data.tanks = results;
          res.send(JSON.stringify(return_data));
        });
      });
    }
  });
 });


function emailSend(storename,getDeliveryNoArray){
  var totalcount =0;
  var totalarrycount = [];
  var sendEmail = [];
  var firstname = [];
  var lastname = [];
  var minuscount = 0;
  totalarrycount[0] = getDeliveryNoArray.length;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'unicoelan@gmail.com',
        pass: 'elan#123' 
    }
  });
  var count=0;
  var invtotalamount = 0;
  var intransittotalamount = 0;
  var custtotalamount = 0;
  var totalamountarr = [];
  console.log("...................store name....."+storename);
  db.query("select store_name,store_first_name,store_last_name,store_email from store where store_name='"+storename+"'", function (error, storeresults, fields) {
    sendEmail[0]= storeresults[0].store_email;
    firstname[0] = storeresults[0].store_first_name
    lastname[0] = storeresults[0].store_last_name
    console.log(".....store first name......"+firstname[0]);
    if (error) throw error;
  });
  let fullhtml = "";
  let finalamount = "";
  let finalhtml = "";
  let headingHtml = "<table size='small' width='80%'><tr><td  width='30%'></td><td style='text-align:left;font-size: 20px;font-weight:bold;color:black;'>Order Confirmation Notice</td></tr></table>";  
  let storenameHtml = "<table size='small' width='80%'><tr><td style='text-align:left;font-size: 18px;font-weight:bold;color:#0038a5;'>Store Name:     "+storename +"</td></tr></table>";  

  let inventoryHtml = "<table size='small' width='80%'><tr><td  width='5%'></td><td style='text-align:left;font-size: 14px;font-weight:bold;color:black;text-decoration: underline;'>Available Inventories Purchased</td></tr></table>";  
  let intransitHtml = "<table size='small' width='80%'><tr><td  width='5%'></td><td style='text-align:left;font-size: 14px;font-weight:bold;color:black;text-decoration: underline;'>In Transit Deliveries Purchased</td></tr></table>"; 
  let customorderHtml = "<table size='small' width='80%'><tr><td  width='5%'></td><td style='text-align:left;font-size: 14px;font-weight:bold;color:black;text-decoration: underline;'>Custom Orders Purchased</td></tr></table>";  
  customorderHtml = customorderHtml + "<table size='small' width='80%'><tr><td style='text-align:right;font-weight:bold;color:black;' width='6%'>Delivery #</td><td width='10%' style='text-align:right;font-weight:bold'>Product Name</td><td width='5%' style='text-align:right;font-weight:bold'>Gallons</td><td width='7%' style='text-align:right;font-weight:bold'>Price/Gal</td><td width='7%' style='text-align:right;font-weight:bold'>Delivery $</td></tr>"
  intransitHtml = intransitHtml + "<table size='small' width='80%'><tr><td style='text-align:right;font-weight:bold;color:black;' width='6%'>Delivery #</td><td width='10%' style='text-align:right;font-weight:bold;color:black;'>Product Name</td><td width='5%' style='text-align:right;font-weight:bold;color:black;'>Gallons</td><td width='7%' style='text-align:right;font-weight:bold;color:black;'>Price/Gal</td><td width='7%' style='text-align:right;font-weight:bold;color:black;'>Delivery $</td></tr>"
  inventoryHtml = inventoryHtml + "<table size='small' width='80%'><tr><td style='text-align:right;font-weight:bold;color:black;' width='6%'>Delivery #</td><td width='10%' style='text-align:right;font-weight:bold;color:black;'>Product Name</td><td width='5%' style='text-align:right;font-weight:bold;color:black;'>Gallons</td><td width='7%' style='text-align:right;font-weight:bold;color:black;'>Price/Gal</td><td width='7%' style='text-align:right;font-weight:bold;color:black;'>Delivery $</td></tr>"
 
  for (j = 0; j < getDeliveryNoArray.length; j++) {
    console.log(".....inside for loop......"+getDeliveryNoArray[j]);
      db.query("select delivery_number,product_name,gallons,price_per_gallons,sheduled_or_transit from orders_prod_price_map where delivery_number='"+getDeliveryNoArray[j]+"' and store_name='"+storename+"'", function (error, prodresults, fields) {
        var length = Object.keys(prodresults).length;
        for (var i = 0; i < length; i++) 
        {
 
          if (prodresults[i].delivery_number.substr(0,2)!='CO' && prodresults[i].sheduled_or_transit=='yes'){
            invtotalamount = invtotalamount + parseFloat(prodresults[i].gallons * prodresults[i].price_per_gallons);
            inventoryHtml = inventoryHtml + "<tr><td width='6%' style='text-align:right'>"+prodresults[i].delivery_number+"</td><td width='10%' style='text-align:right'>"+prodresults[i].product_name+"</td><td width='5%' style='text-align:right'>"+(prodresults[i].gallons).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td><td width='7%' style='text-align:right'>"+prodresults[i].price_per_gallons+"</td><td width='7%' style='text-align:right'>"+(prodresults[i].gallons * prodresults[i].price_per_gallons).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr>"
          } 
          if (prodresults[i].delivery_number.substr(0,2)!='CO' && prodresults[i].sheduled_or_transit=='no'){
            intransittotalamount = intransittotalamount + parseFloat(prodresults[i].gallons * prodresults[i].price_per_gallons);
            intransitHtml = intransitHtml + "<tr><td width='6%' style='text-align:right'>"+prodresults[i].delivery_number+"</td><td width='10%' style='text-align:right'>"+prodresults[i].product_name+"</td><td width='5%' style='text-align:right'>"+(prodresults[i].gallons).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td><td width='7%' style='text-align:right'>"+prodresults[i].price_per_gallons+"</td><td width='7%' style='text-align:right'>"+(prodresults[i].gallons * prodresults[i].price_per_gallons).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr>"
          }          
          if (prodresults[i].delivery_number.substr(0,2)=='CO'){
            custtotalamount = custtotalamount + parseFloat(prodresults[i].gallons * prodresults[i].price_per_gallons);
            customorderHtml = customorderHtml + "<tr><td width='6%' style='text-align:right'>"+prodresults[i].delivery_number+"</td><td width='10%' style='text-align:right'>"+prodresults[i].product_name+"</td><td width='5%' style='text-align:right'>"+(prodresults[i].gallons).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td><td width='7%' style='text-align:right'>"+prodresults[i].price_per_gallons+"</td><td width='7%' style='text-align:right'>"+(prodresults[i].gallons * prodresults[i].price_per_gallons).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr>"
          }
          if (i==(length-1)){
            count = count +1;
          }
          if (count==totalarrycount[0]){
            console.log(".....inside send mail....");
            finalamount = invtotalamount + intransittotalamount + custtotalamount;
            inventoryHtml = inventoryHtml + "<tr></tr><tr><td width='6%'></td><td width='10%'></td><td width='5%'></td><td width='5%' style='text-align:right;font-weight:bold;color:black;'>Total Amount: </td><td style='text-align:right;font-weight:bold;color:black;' width='7%'>$"+invtotalamount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr></table>"
            intransitHtml = intransitHtml + "<tr></tr><tr><td width='6%'></td><td width='10%'></td><td width='5%'></td><td width='5%' style='text-align:right;font-weight:bold;color:black;'>Total Amount: </td><td style='text-align:right;font-weight:bold;color:black;' width='7%'>$"+intransittotalamount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr></table>"
            customorderHtml = customorderHtml + "<tr></tr><tr><td width='6%'></td><td width='10%'></td><td width='5%'></td><td width='5%' style='text-align:right;font-weight:bold;color:black;'>Total Amount: </td><td style='text-align:right;font-weight:bold;color:black;' width='7%'>$"+custtotalamount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr></table>"
            finalhtml = "<table size='small' width='80%'><tr></tr><tr><td width='6%'></td><td width='10%'><td width='5%'></td><td width='8%' style='text-align:right;font-weight:bold;color:#0038a5;'>Grand Total Amount: </td><td style='text-align:right;font-weight:bold;color:#0038a5;' width='7%'>$"+finalamount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')+"</td></tr></table>"
            fullhtml = headingHtml + storenameHtml + inventoryHtml + intransitHtml + customorderHtml + finalhtml
            let mailOptions = {
              from: 'kovantechnology@gmail.com', 
              to: sendEmail[0], 
              subject: 'Your Customer Products Order Confirmation',
              html: fullhtml
            }
            transporter.sendMail(mailOptions, (err, data) => {
              if (err) {return log(new Error().stack);}return log('Email sent!!!');
            });
          }
        }
        if (error) throw error;
      });
  }
  console.log("...mail calling the function...");
}


app.post('/updateordersummary', function (req, res) {
  console.log("....inside the updateorder summary");
  //console.log(req);
  var return_data ={};
  var data = [];
  let store_name=req.body.storeid;
  let delivery_amount=0;
  let customer_address="";customer_email="";customer_phone="";customer_first_name="";customer_last_name="";
  let user_id=req.body.useremail;delivery_number="";bol_status_description="";
  let i;delivery_date="";bill_of_lading_id="";customer="";location_id="";terminal_name="";order_id="";
  var insertcount=0;
  var totalcount =0;
  var tempdeliveryamount = 0;
  var deliveryamtarray = [];
  var deliveryamtarraycnt = 0;
  var unl87pricearray=[],unl93pricearray=[],unlusldpricearray=[],unlb20pricearray=[],unlb5pricearray=[],unldefpricearray=[];
  var total = -1;
  var overalltotalarray=[];
  var custordertotal=0;tempdeliveryno='';
  var withoutcustordertotal=0;
  var prices = [];
  var map = new Map(); 
  prices=req.body.prices;
  var bolarray=[],customerarray=[], locationarray=[], terminalarray=[], deliverynumberarray=[];
  var corporationnamearray=[];
  var deliverynoarray=[];gallons87array=[];prod87array=[];
  var gallons93array=[];prod93array=[];gallonsusldarray=[];produsldarray=[];
  var gallonsb5array=[];prodb5array=[];gallonsb20array=[];prodb20array=[];
  var custfnamearry=[]; custlnamearry=[]; custaddrarry=[]; custemailarry=[]; custphonearry=[];
  var inventoryarry=[];
  var timeInMss=[];
  var getcheckedItems = [];
  getcheckedItems = req.body.checkedItems;
  if (req.body.customOrder!=null){
  console.log("... req.body.customer_order.length .. "+req.body.customOrder.length);
    getcheckedItems = req.body.checkedItems.concat(req.body.customOrder);
  }

  for (i = 0; i < getcheckedItems.length; i++) {
    //console.log(" output of checked items + "+req.body.checkedItems[i]);
    if (getcheckedItems[i]!=null){
      totalcount = totalcount +1;
    }
    overalltotalarray.push(totalcount)
  }

  for(var k = 0; k < prices.length; k++){ 
    unl87pricearray[0] = prices[k].RFG87E10;
    unl93pricearray[0] = prices[k].RFG93E10;
    unlusldpricearray[0] = prices[k].ULSD;
    unlb5pricearray[0] = prices[k].B5;
    unlb20pricearray[0] = prices[k].B20;
    unldefpricearray[0] = prices[k].DEF;
  } 
 // for (i = 0; i < getcheckedItems.length; i++) {
  for (i = 0; i < getcheckedItems.length; i++) {
    //console.log(" output of checked items + "+getcheckedItems[i]);
    if (getcheckedItems[i]!=null && getcheckedItems[i].delivery_number!== ""){
      gallons87array=[],prod87array=[],
      gallons93array=[],prod93array=[],
      gallonsusldarray=[],produsldarray=[],
      gallonsb5array=[],prodb5array=[],
      gallonsb20array=[],prodb20array=[],
      timeInMss[0] = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
      deliverynoarray=[],corporationnamearray=[];inventoryarry=[];
      bolarray=[],customerarray=[], locationarray=[], terminalarray=[];
      custfnamearry=[], custlnamearry=[], custaddrarry=[], custemailarry=[], custphonearry=[];
      //console.log('...without CO delivery.....'+getcheckedItems[i].delivery_number);
      withoutcustordertotal = withoutcustordertotal+1;
      console.log('...unldefpricearray..'+unldefpricearray[0]);
      console.log('.............start..................');
      deliverynoarray.push(getcheckedItems[i].delivery_number);
      deliverynumberarray.push(getcheckedItems[i].delivery_number);
      console.log('...deliverynoarray....'+deliverynoarray[0]);
      if (deliverynoarray[0].substr(0,2)!='CO'){
        prod87array.push(getcheckedItems[i].RFG87E10);
        gallons87array.push(getcheckedItems[i].UNL87GrossGallons);
        prod93array.push(getcheckedItems[i].RFG93E10);
        gallons93array.push(getcheckedItems[i].PREM93GrossGallons);
        produsldarray.push(getcheckedItems[i].ULSD);
        gallonsusldarray.push(getcheckedItems[i].ULSDGrossGallons);
        prodb20array.push(getcheckedItems[i].B20);
        gallonsb20array.push(getcheckedItems[i].B20GrossGallons);
        delivery_amount = getcheckedItems[i].totalamount;
        deliveryamtarray.push(getcheckedItems[i].totalamount);
        bolarray=[],customerarray=[],locationarray=[],terminalarray=[];
      } else {
        prod87array.push('UNL 87 RFG ETH 10%');
        gallons87array.push(getcheckedItems[i].RFG87E10);  
        prod93array.push('PREM 93 RFG ETH 10%');
        gallons93array.push(getcheckedItems[i].RFG93E10);
        produsldarray.push('ULSD CLEAR TXLED');
        gallonsusldarray.push(getcheckedItems[i].ULSD);
        prodb20array.push('B20 Biodiesel');
        gallonsb20array.push(getcheckedItems[i].B20);
        deliveryamtarray.push(0);
      }
      inventoryarry.push(getcheckedItems[i].inventory);
      console.log('..new delivery_number...'+deliverynoarray[0]);

      //console.log('.............end..................'); 
      if (deliverynoarray[0].substr(0,2)!='CO'){
        db.query("select delivery_date,bill_of_lading_id,customer,location_id,terminal_name from store_inventory where delivery_number='"+deliverynoarray[0]+"'",  function (error, invresults, fields){
          bolarray.push(invresults[0].bill_of_lading_id);
          customerarray.push(invresults[0].customer);
          locationarray.push(invresults[0].location_id);
          terminalarray.push(invresults[0].terminal_name);
        });
      }     
      if (deliverynoarray[0].substr(0,2)!='CO'){
        var sql = "UPDATE store_inventory SET bol_status_description = 'Completed' WHERE  dealer='"+store_name+"' and delivery_number = '"+(deliverynoarray[0])+"'";   
        db.query(sql, function (err, result) {
        });
      }
      var sql = "SET SQL_SAFE_UPDATES = 0";   
      db.query(sql, function (err, result) {
      });
      console.log("......inv or transit...."+inventoryarry[0]);
      if(prod87array[0]=='UNL 87 RFG ETH 10%' && (gallons87array[0] >0)){
          console.log('..before .87...insert...'+gallons87array[0]);
          var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+deliverynoarray[0]+"','"+prod87array[0]+"','"+store_name+"','"+unl87pricearray[0]+"',"+gallons87array[0]+",'"+timeInMss[0]+"','"+inventoryarry[0]+"')";
          db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
          });
       }
       if(deliverynoarray[0].substr(0,2)!='CO' && prod87array[0]=='UNL 87 RFG ETH 10%' && (gallons87array[0] >0) && (inventoryarry[0]=='yes')){
        var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = RFG87E10 - "+gallons87array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update...87....scheduled..');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prod87array[0]=='UNL 87 RFG ETH 10%' && (gallons87array[0] >0) && (inventoryarry[0]=='no')){
        var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = RFG87E10 - "+gallons87array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..87.....transit...');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prod87array[0]=='UNL 87 RFG ETH 10%' && (gallons87array[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = RFG87E10 + "+gallons87array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..87....order...');
        });
      }
      if(deliverynoarray[0].substr(0,2)=='CO' && prod87array[0]=='UNL 87 RFG ETH 10%' && (gallons87array[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = RFG87E10 + "+gallons87array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Custom'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update.87...custom.order...');
        });
      }
      if(prod93array[0]=='PREM 93 RFG ETH 10%' && (gallons93array[0] >0)){
        console.log('..before .93..insert...'+gallons93array[0]);
        var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+deliverynoarray[0]+"','"+prod93array[0]+"','"+store_name+"','"+unl93pricearray[0]+"',"+gallons93array[0]+",'"+timeInMss[0]+"','"+inventoryarry[0]+"')";
        db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prod93array[0]=='PREM 93 RFG ETH 10%' && (gallons93array[0] >0) && (inventoryarry[0]=='yes')){
        var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = RFG93E10 - "+gallons93array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..93....scheduled..');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prod93array[0]=='PREM 93 RFG ETH 10%' && (gallons93array[0] >0) && (inventoryarry[0]=='no')){
        var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = RFG93E10 - "+gallons93array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..93...transit...');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prod93array[0]=='PREM 93 RFG ETH 10%' && (gallons93array[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = RFG93E10 + "+gallons93array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..93...order...');
        });
      }
      if(deliverynoarray[0].substr(0,2)=='CO' && prod93array[0]=='PREM 93 RFG ETH 10%' && (gallons93array[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = RFG93E10 + "+gallons93array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Custom'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..93...Custom.order...');
        });
      }
      if(produsldarray[0]=='ULSD CLEAR TXLED' && (gallonsusldarray[0] >0)){
        console.log('..before ..ULSDinsert...'+gallonsusldarray[0]);
        var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+deliverynoarray[0]+"','"+produsldarray[0]+"','"+store_name+"','"+unlusldpricearray[0]+"',"+gallonsusldarray[0]+",'"+timeInMss[0]+"','"+inventoryarry[0]+"')";
        db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && produsldarray[0]=='ULSD CLEAR TXLED' && (gallonsusldarray[0] >0) && (inventoryarry[0]=='yes')){
        var sql = "UPDATE elan_cust_prod_summary SET ULSD = ULSD - "+gallonsusldarray[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..ULSD.scheduled..');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && produsldarray[0]=='ULSD CLEAR TXLED' && (gallonsusldarray[0] >0) && (inventoryarry[0]=='no')){
        var sql = "UPDATE elan_cust_prod_summary SET ULSD = ULSD - "+gallonsusldarray[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update.ULSD.transit...');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && produsldarray[0]=='ULSD CLEAR TXLED' && (gallonsusldarray[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET ULSD = ULSD + "+gallonsusldarray[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..ULSD..order...');
        });
      }
      if(deliverynoarray[0].substr(0,2)=='CO' && produsldarray[0]=='ULSD CLEAR TXLED' && (gallonsusldarray[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET ULSD = ULSD + "+gallonsusldarray[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Custom'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..ULSD..Custom.order...');
        });
      }
      if(prodb20array[0]=='B20 Biodiesel' && (gallonsb20array[0] >0)){
        console.log('..before B20 insert...'+gallonsb20array[0]);
        var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+deliverynoarray[0]+"','"+prodb20array[0]+"','"+store_name+"','"+unlb20pricearray[0]+"',"+gallonsb20array[0]+",'"+timeInMss[0]+"','"+inventoryarry[0]+"')";
        db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prodb20array[0]=='B20 Biodiesel' && (gallonsb20array[0] >0) && (inventoryarry[0]=='yes')){
        var sql = "UPDATE elan_cust_prod_summary SET B20 = B20 - "+gallonsb20array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update. B20 ..scheduled..');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prodb20array[0]=='B20 Biodiesel' && (gallonsb20array[0] >0) && (inventoryarry[0]=='no')){
        var sql = "UPDATE elan_cust_prod_summary SET B20 = B20 - "+gallonsb20array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update. B20 .transit...');
        });
      }
      if(deliverynoarray[0].substr(0,2)!='CO' && prodb20array[0]=='B20 Biodiesel' && (gallonsb20array[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET B20 = B20 + "+gallonsb20array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update. B20 .order...');
        });
      }
      if(deliverynoarray[0].substr(0,2)=='CO' && prodb20array[0]=='B20 Biodiesel' && (gallonsb20array[0] >0)){
        var sql = "UPDATE elan_cust_prod_summary SET B20 = B20 + "+gallonsb20array[0]+" WHERE name = '"+store_name+"' and sheduled_or_transit='Custom'";
        db.query(sql, function (err, result) {if (err) throw err;
          console.log('...update..B20.Custom.order...');
        });
      }
      db.query("select customer_first_name,customer_last_name,customer_address_1,customer_email,customer_phone_1 from customer where corporation_name=(select corporation_name from store where store_name='"+store_name+"')", function (error, customeresults, fields) {
      if (error) throw error;
      customer_first_name=customeresults[0].customer_first_name;       
      customer_last_name=customeresults[0].customer_last_name;       
      customer_address=customeresults[0].customer_address_1;       
      customer_email=customeresults[0].customer_email;
      customer_phone=customeresults[0].customer_phone_1;
      //console.log("..customer_phone..."+customer_phone);
      order_id="OR"+moment(Date.now()).format('YYYYMMDD')+"_"+deliverynumberarray[deliveryamtarraycnt];
      //console.log("....before order placement...");
        var sql = "INSERT INTO orders_placement(delivery_number,bill_of_lading_id,customer,location_id,terminal_name,user_id,order_id,store_name,delivery_amount,customer_address,customer_email,customer_phone,delivery_date,customer_first_name,customer_last_name) VALUES ('"+deliverynumberarray[deliveryamtarraycnt]+"','"+bolarray[0]+"','"+customerarray[0]+"','"+locationarray[0]+"','"+terminalarray[0]+"','"+user_id+"','"+order_id+"','"+store_name+"',"+deliveryamtarray[deliveryamtarraycnt]+",'"+customer_address+"','"+customer_email+"','"+customer_phone+"','"+timeInMss[0]+"','"+customer_first_name+"','"+customer_last_name+"')";
        deliveryamtarraycnt = deliveryamtarraycnt + 1;
        db.query(sql, function (err, result) {
          if (err) throw err;
          insertcount = insertcount + 1;
            if (overalltotalarray[0]==insertcount){
              console.log("....overalltotalarray[0]......"+overalltotalarray[0]);
              console.log("....insertcount......."+insertcount);
              emailSend(store_name, deliverynumberarray)
              res.send({ success: "yes" });
            } 
          });
      });
     //console.log('...delivery number.....'+req.body.totalval[i].delivery_number);
   }
  }
});

app.get('/storeusers', function (req, res) {
  console.log(req.checkbox);
  db.query('select * from users', function (error, results, fields) {
   if (error) throw error;
   console.log(JSON.stringify(results));
   res.end(JSON.stringify(results));
 });
});
