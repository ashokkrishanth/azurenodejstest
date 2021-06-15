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


app.post('/getordersummary', function (req, res) {
  //console.log(req);
  var return_data ={};
  var storename = req.body.storename;
  var ullageoutput = []
  var custorserialno = [];
  var ullagearray = [];
  var RFG87E10=0; var RFG93E10=0;var ULSD=0;var B5=0;var B20=0;var DEF=0; var total=0;
  var totRFG87E10=0; var totRFG93E10=0;var totULSD=0;var totB5=0;var totB20=0;var totDEF=0;
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
          return_data.intransit = intransitresults;
          //console.log(return_data);
          
        });
        db.query("SET SESSION sql_mode=''");
        db.query("select sum(RFG87E10) as RFG87E10,sum(RFG93E10) as RFG93E10,sum(ULSD) as ULSD,sum(B5) as B5,sum(B20) as B20,sum(DEF) as DEF from elan_cust_prod_summary where name='"+storename+"'", function (error, summaryresults, fields) {
          if (error) throw error;
          summRFG87E10= summaryresults[0].RFG87E10,summRFG93E10= summaryresults[0].RFG93E10,
          summULSD= summaryresults[0].ULSD,summB5= summaryresults[0].B5,
          summB20= summaryresults[0].B20,summDEF= summaryresults[0].DEF
          console.log("..insdie the summay function.....");
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

          db.query("select * from store_tanks where store_name='"+storename+"'", function (error, results, fields) {
            if (error) throw error;
            var tankconn = false;
            var length = Object.keys(results).length;
            var total=0;k=-1;
            for (var i = 0; i < length; i++) 
            {
              k = k + 1;
              if(results[i].tank_connection=true && i==1){
                tankconn=true;
                continue;
              }
              if(results[k].tank_product=='RFG87E10'){
                total = results[k].tank_size - (ullagearray[0]);
                ullageoutput.push(total);
              }
              if(results[k].tank_product=='RFG93E10'){
                total = results[k].tank_size - (ullagearray[1]);
                ullageoutput.push(total);
              }
              if(results[k].tank_product=='ULSD'){
                total = results[k].tank_size - (ullagearray[2]);
                ullageoutput.push(total);
              }
              if(results[k].tank_product=='B5'){
                total = results[k].tank_size - (ullagearray[3]);
                ullageoutput.push(total);
              }
              if(results[k].tank_product=='B20'){
                total = results[k].tank_size - (ullagearray[4]);
                ullageoutput.push(total);
              }
              if(results[k].tank_product=='DEF'){
                total = results[k].tank_size - (ullagearray[5]);
                ullageoutput.push(total);
              }
            };
            return_data.ullage = ullageoutput;

            return_data.cuorderserialno = custorserialno;
            res.send(JSON.stringify(return_data));
          })    
        });

      });
    }
  });
});



app.post('/getDashboardValues', function (req, res) {
  console.log("....inside the getDashboardValues ");
  //console.log(req);
  var return_data ={};
  var data = [];
  var storename = req.body.storename;
  var summRFG87E10=0, summRFG93E10=0, summULSD=0, summB5=0, summB20=0, summDEF=0;
  var ullageoutput = []
  var ullagearray = [];
  var tanknumbergrpoutput = [];
  var tanksizegrpoutput = [];
  var tankproductgrpoutput = [];
  var custinvarray = [];custinvarrayoutput = [];
  var elaninvarray = [];elaninvarrayoutput = [];
  var elantransitarray = [];elantransitarrayoutput = [];
  console.log("..storename.............."+storename);

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
          console.log(elaninvarray);
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
        db.query("select tank_number,tank_product, sum(tank_size) as tanksize, count(tank_product) as totalproduct FROM store_tanks where store_name='"+storename+"'  group by tank_product having count(tank_product)>0", function (error, groupresults, fields) {
          if (error) throw error;
        
          var grplength = Object.keys(groupresults).length;
          for (var i = 0; i < grplength; i++) 
          {
          if (groupresults[i].totalproduct>1){
              gocount = gocount + 1;
              tanknumbergrpoutput.push(groupresults[i].tank_number + "-GO"+gocount);
            }
            else {
              tanknumbergrpoutput.push(groupresults[i].tank_number);
            }
            tankproductgrpoutput.push(groupresults[i].tank_product);

            tanksizegrpoutput.push(groupresults[i].tanksize);
            if(groupresults[i].tank_product=='RFG87E10'){
              elaninvarrayoutput.push(elaninvarray[0]); 
              elantransitarrayoutput.push(elantransitarray[0]);
              custinvarrayoutput.push(custinvarray[0]);
              total = groupresults[i].tanksize - (ullagearray[0]);ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='RFG93E10'){
              elaninvarrayoutput.push(elaninvarray[1]); 
              elantransitarrayoutput.push(elantransitarray[1]);
              custinvarrayoutput.push(custinvarray[1]);
              total = groupresults[i].tanksize - (ullagearray[1]);ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='ULSD'){
              elaninvarrayoutput.push(elaninvarray[2]); 
              elantransitarrayoutput.push(elantransitarray[2]);
              custinvarrayoutput.push(custinvarray[2]);
              total = groupresults[i].tanksize - (ullagearray[2]);ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='B5'){
              elaninvarrayoutput.push(elaninvarray[3]); 
              elantransitarrayoutput.push(elantransitarray[3]);
              custinvarrayoutput.push(custinvarray[3]);
              total = groupresults[i].tanksize - (ullagearray[3]);ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='B20'){
              elaninvarrayoutput.push(elaninvarray[4]); 
              elantransitarrayoutput.push(elantransitarray[4]);
              custinvarrayoutput.push(custinvarray[4]);
              total = groupresults[i].tanksize - (ullagearray[4]);ullageoutput.push(total);
            }
            if(groupresults[i].tank_product=='DEF'){
              elaninvarrayoutput.push(elaninvarray[5]); 
              elantransitarrayoutput.push(elantransitarray[5]);
              custinvarrayoutput.push(custinvarray[5]);
              total = groupresults[i].tanksize - (ullagearray[5]);ullageoutput.push(total);
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


 app.post('/updateordersummary', function (req, res) {
  console.log("....inside the updateorder summary");
  //console.log(req);
  var return_data ={};
  var data = [];
  var tmpdeliveryboxes = req.body.checkedItems;
  let store_name=req.body.storeid;
  let delivery_amount=900000.00;
  let corporation_name="";customer_address="";customer_email="";customer_phone="";customer_first_name="";customer_last_name="";
  let user_id=req.body.useremail;delivery_number="";bol_status_description="";
  let i;delivery_date="";bill_of_lading_id="";customer="";location_id="";terminal_name="";order_id="123456";
  //console.log("..storename..."+req.body.storeid);
  //console.log("..user_id..."+user_id);
  let completed="N";
  let totaldeliverynos=0;
  var insertcount=0;
  var totdeliverylength=0;
  var totdeliverycount=-1;
  var totalcount =0;
  var gallonsmergearray = [];
  var UNL87RFGscharray = [],UNL87RFGtransitarray = [],UNL87RFGorderarray = [];
  var UNL93scharray = [],UNL93transitarray = [],UNL93orderarray = [];
  var USLDscharray = [],USLDtransitarray = [],ULSDorderarray = [];
  var B20scharray = [],B20transitarray = [],B20orderarray = [];
  var total = -1;
  totaldeliverynos=req.body.checkedItems.length;
  for (i = 0; i < req.body.checkedItems.length; i++) {
    console.log(" output of checked items + "+req.body.checkedItems[i]);
    if (req.body.checkedItems[i]!=null){
      totalcount = totalcount +1;
    }
  }
  for (i = 0; i < req.body.checkedItems.length; i++) {

    console.log(" output of checked items + "+req.body.checkedItems[i]);
    if (req.body.checkedItems[i]!=null){
      //console.log(req.body.checkedItems[i]);
      db.query("select delivery_number,DATE_FORMAT(delivery_date,'%Y-%m-%d %H:%i:%s') AS 'delivery_date' from store_inventory where id='"+req.body.checkedItems[i]+"'", function (error, getdeliveryno, fields) {
        if (error) throw error;
        console.log(getdeliveryno[0].delivery_number + " delivery numbers");
        //console.log(" getelsjlj delivery_date + "+ getdeliveryno[0].delivery_date);
        var sql = "UPDATE store_inventory SET bol_status_description = 'Completed' WHERE  dealer='"+store_name+"' and delivery_number = '"+getdeliveryno[0].delivery_number+"'";   
        db.query(sql, function (err, result) {
          if (err) throw err;
        });

        db.query("SET SESSION sql_mode=''");
        db.query("select id,bill_of_lading_id,delivery_date,bol_status_description,max(case when (product_name='UNL 87 RFG ETH 10%') then product_name else NULL end) as 'UNL87RFG',max(case when (product_name='UNL 87 RFG ETH 10%') then gross_gallons else NULL end) as 'UNL87GrossGallons',max(case when (product_name='PREM 93 RFG ETH 10%') then product_name else NULL end) as 'PREM93RFG',max(case when (product_name='PREM 93 RFG ETH 10%') then gross_gallons else NULL end) as 'PREM93GrossGallons',max(case when (product_name='ULSD CLEAR TXLED') then product_name else NULL end) as 'ULSDCLEARTXLED',max(case when (product_name='ULSD CLEAR TXLED') then gross_gallons else NULL end) as 'ULSDGrossGallons', max(case when (product_name='B20 Biodiesel') then product_name else NULL end) as 'B20Biodiesel',max(case when (product_name='B20 Biodiesel') then gross_gallons else NULL end) as 'B20GrossGallons' from store_inventory where dealer='"+store_name+"' and delivery_number='"+getdeliveryno[0].delivery_number+"'", function (error, productresults, fields) {
          if (error) throw error;
          console.log("get delivery_number...."+getdeliveryno[0].delivery_number);
          bol_status_description=productresults[0].bol_status_description;

          if(productresults[0].UNL87RFG=='UNL 87 RFG ETH 10%' && (productresults[0].UNL87GrossGallons >0)){
            price_per_gallons="1.75";
 
            var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+getdeliveryno[0].delivery_number+"','"+productresults[0].UNL87RFG+"','"+store_name+"','"+price_per_gallons+"',"+productresults[0].UNL87GrossGallons+",'"+getdeliveryno[0].delivery_date+"','"+bol_status_description+"')";
            db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
            });
            console.log("...before scheduled..and store name....."+store_name);
            //console.log("...bol_status_description....."+bol_status_description);
              db.query("select RFG87E10 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Scheduled'", function (error, prodschresults, fields) {
                if (error) throw error;
                updRFG87E101=prodschresults[0].RFG87E10;
                if(updRFG87E101 >= (productresults[0].UNL87GrossGallons)) {
                  UNL87RFGscharray.push(productresults[0].UNL87GrossGallons)
                  var sum87amt=0;subtractquery = 0;
                  for (var i = 0; i < UNL87RFGscharray.length; i++) {
                     sum87amt = sum87amt + UNL87RFGscharray[i];
                  }
                  subtractquery = prodschresults[0].RFG87E10 - sum87amt;
                  var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
                  db.query(sql, function (err, result) {if (err) throw err;
                  });
                }
              });
              db.query("select RFG87E10 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Transit'", function (error, prodtransitresults, fields) {
                if (error) throw error;
                updRFG87E101=prodtransitresults[0].RFG87E10;
                if(updRFG87E101 >= (productresults[0].UNL87GrossGallons)) {
                  UNL87RFGtransitarray.push(productresults[0].UNL87GrossGallons)
                  var sum87amt=0;subtractquery = 0;
                  for (var i = 0; i < UNL87RFGtransitarray.length; i++) {
                    sum87amt = sum87amt + UNL87RFGtransitarray[i];
                  }
                  subtractquery = prodtransitresults[0].RFG87E10 - sum87amt;
                  var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
                  db.query(sql, function (err, result) {if (err) throw err;
                  });
                }
              });
              console.log("...before orders..and store name....."+store_name);
              db.query("select RFG87E10 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Order'", function (error, orderresults, fields) {
                if (error) throw error;
                console.log("...inside order....."+store_name);
                updRFG87E10=orderresults[0].RFG87E10;
                if(updRFG87E10=="NaN"){updRFG87E10=0;}
                UNL87RFGorderarray.push(productresults[0].UNL87GrossGallons);
                var sum87amt=0;addquery = 0;
                for (var i = 0; i < UNL87RFGorderarray.length; i++) {
                   sum87amt = sum87amt + UNL87RFGorderarray[i];
                }
                addquery = orderresults[0].RFG87E10 + sum87amt;
                var sql = "UPDATE elan_cust_prod_summary SET RFG87E10 = "+addquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
                db.query(sql, function (err, result) {if (err) throw err;});
                db.commit;
              });             
          }

          if(productresults[0].PREM93RFG=='PREM 93 RFG ETH 10%' && (productresults[0].PREM93GrossGallons >0)){
            price_per_gallons="1.75";
            var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+getdeliveryno[0].delivery_number+"','"+productresults[0].PREM93RFG+"','"+store_name+"','"+price_per_gallons+"',"+productresults[0].PREM93GrossGallons+",'"+getdeliveryno[0].delivery_date+"','"+bol_status_description+"')";
            db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
            });
            db.query("select RFG93E10 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Scheduled'", function (error, prodresults, fields) {
              if (error) throw error;
              updPREM93RFG=prodresults[0].RFG93E10;
              if(updPREM93RFG >= (productresults[0].PREM93GrossGallons)){
                UNL93scharray.push(productresults[0].PREM93GrossGallons)
                var sum87amt=0;subtractquery = 0;
                for (var i = 0; i < UNL93scharray.length; i++) {
                   sum87amt = sum87amt + UNL93scharray[i];
                }
                subtractquery = prodresults[0].RFG93E10 - sum87amt;
               var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
                db.query(sql, function (err, result) {if (err) throw err;});
               }
            });
            db.query("select RFG93E10 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Transit'", function (error, prodresults, fields) {
              if (error) throw error;
              updPREM93RFG=prodresults[0].RFG93E10;
              if(updPREM93RFG >= (productresults[0].PREM93GrossGallons)){
                UNL93transitarray.push(productresults[0].PREM93GrossGallons)
                var sum87amt=0;subtractquery = 0;
                for (var i = 0; i < UNL93transitarray.length; i++) {
                   sum87amt = sum87amt + UNL93transitarray[i];
                }
                subtractquery = prodresults[0].RFG93E10 - sum87amt;
                var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
                db.query(sql, function (err, result) {if (err) throw err;});
               }
            });
            db.query("select RFG93E10 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Order'", function (error, prodresults, fields) {
              if (error) throw error;
              if(updRFG87E10=="NaN"){updRFG87E10=0;}
              UNL93orderarray.push(productresults[0].PREM93GrossGallons);
              var sum87amt=0;addquery = 0;
              for (var i = 0; i < UNL93orderarray.length; i++) {
                 sum87amt = sum87amt + UNL93orderarray[i];
              }
              addquery = prodresults[0].RFG93E10 + sum87amt;
              var sql = "UPDATE elan_cust_prod_summary SET RFG93E10 = "+addquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
              db.query(sql, function (err, result) {if (err) throw err;});
            });
          }          
          if(productresults[0].ULSDCLEARTXLED=='ULSD CLEAR TXLED' && (productresults[0].ULSDGrossGallons >0)){
            price_per_gallons="1.75";
            var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+getdeliveryno[0].delivery_number+"','"+productresults[0].ULSDCLEARTXLED+"','"+store_name+"','"+price_per_gallons+"',"+productresults[0].ULSDGrossGallons+",'"+getdeliveryno[0].delivery_date+"','"+bol_status_description+"')";
            db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
            });
            db.query("select ULSD from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Scheduled'", function (error, prodresults, fields) {
              if (error) throw error;
              updULSD=prodresults[0].ULSD;
              if(updULSD >= (productresults[0].ULSDGrossGallons)){
                USLDscharray.push(productresults[0].ULSDGrossGallons)
                var sum87amt=0;subtractquery = 0;
                for (var i = 0; i < USLDscharray.length; i++) {
                   sum87amt = sum87amt + USLDscharray[i];
                }
                subtractquery = prodresults[0].ULSD - sum87amt;
                var sql = "UPDATE elan_cust_prod_summary SET ULSD = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
                db.query(sql, function (err, result) {if (err) throw err;});
              }
            });
            db.query("select ULSD from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Transit'", function (error, prodresults, fields) {
              if (error) throw error;
              updULSD=prodresults[0].ULSD;
              if(updULSD >= (productresults[0].ULSDGrossGallons)){
                USLDtransitarray.push(productresults[0].ULSDGrossGallons)
                var sum87amt=0;subtractquery = 0;
                for (var i = 0; i < USLDtransitarray.length; i++) {
                   sum87amt = sum87amt + USLDtransitarray[i];
                }
                subtractquery = prodresults[0].ULSD - sum87amt;                
                var sql = "UPDATE elan_cust_prod_summary SET ULSD = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
                db.query(sql, function (err, result) {if (err) throw err;});
              }
            });            
            db.query("select ULSD from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Order'", function (error, prodresults, fields) {
              if (error) throw error;
              updULSD=prodresults[0].ULSD;
              if(updULSD=="NaN"){updULSD=0;}
              ULSDorderarray.push(productresults[0].ULSDGrossGallons);
              var sum87amt=0;addquery = 0;
              for (var i = 0; i < ULSDorderarray.length; i++) {
                 sum87amt = sum87amt + ULSDorderarray[i];
              }
              addquery = prodresults[0].ULSD + sum87amt;
              var sql = "UPDATE elan_cust_prod_summary SET ULSD = "+addquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
              db.query(sql, function (err, result) {if (err) throw err;});
            });
          }
          if(productresults[0].B20Biodiesel=='B20 Biodiesel' && (productresults[0].B20GrossGallons >0)){
            price_per_gallons="1.75";
            var sql = "INSERT INTO orders_prod_price_map(delivery_number,product_name,store_name,price_per_gallons,gallons,delivery_date,sheduled_or_transit) VALUES ('"+getdeliveryno[0].delivery_number+"','"+productresults[0].B20Biodiesel+"','"+store_name+"','"+price_per_gallons+"',"+productresults[0].B20GrossGallons+",'"+getdeliveryno[0].delivery_date+"','"+bol_status_description+"')";
            db.query(sql, function (err, result) {if (err) throw err;console.log(result.affectedRows + " record(s) updated");
            });
            db.query("select B20 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Scheduled'", function (error, prodresults, fields) {
              if (error) throw error;
               updB20=prodresults[0].B20;
               if(updB20 >= (productresults[0].B20GrossGallons)){
                B20scharray.push(productresults[0].B20GrossGallons)
                var sum87amt=0;subtractquery = 0;
                for (var i = 0; i < B20scharray.length; i++) {
                   sum87amt = sum87amt + B20scharray[i];
                }
                subtractquery = prodresults[0].B20 - sum87amt;
                var sql = "UPDATE elan_cust_prod_summary SET B20 = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Scheduled'";
                  db.query(sql, function (err, result) {if (err) throw err;});
                }
            });
            db.query("select B20 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Transit'", function (error, prodresults, fields) {
              if (error) throw error;
               updB20=prodresults[0].B20;
               if(updB20 >= (productresults[0].B20GrossGallons)){
                B20transitarray.push(productresults[0].B20GrossGallons)
                var sum87amt=0;subtractquery = 0;
                for (var i = 0; i < B20transitarray.length; i++) {
                   sum87amt = sum87amt + B20transitarray[i];
                }
                subtractquery = prodresults[0].B20 - sum87amt;
                  var sql = "UPDATE elan_cust_prod_summary SET B20 = "+subtractquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Transit'";
                  db.query(sql, function (err, result) {if (err) throw err;});
                }
            });

            db.query("select B20 from elan_cust_prod_summary where name='"+store_name+"' and sheduled_or_transit='Order'", function (error, prodresults, fields) {
              if (error) throw error;
               updB20=prodresults[0].B20;
               if(updB20=="NaN"){updB20=0;}
               B20orderarray.push(productresults[0].B20GrossGallons);
               var sum87amt=0;addquery = 0;
               for (var i = 0; i < B20orderarray.length; i++) {
                  sum87amt = sum87amt + B20orderarray[i];
               }
               addquery = prodresults[0].B20 + sum87amt;
                var sql = "UPDATE elan_cust_prod_summary SET B20 = "+addquery+" WHERE name = '"+store_name+"' and sheduled_or_transit='Order'";
               db.query(sql, function (err, result) {if (err) throw err;});
            });
          }
          //console.log("....before start order placement...");
          db.query("select delivery_date,bill_of_lading_id,customer,location_id,terminal_name from store_inventory where delivery_number='"+getdeliveryno[0].delivery_number+"'", function (error, invresults, fields) {
            if (error) throw error;
            bill_of_lading_id=invresults[0].bill_of_lading_id;
            customer=invresults[0].customer;location_id=invresults[0].location_id;
            terminal_name=invresults[0].terminal_name;
            db.query("select corporation_name from store where store_name='"+store_name+"'", function (error, storeresults, fields) {
              if (error) throw error;
              corporation_name=storeresults[0].corporation_name;
              //console.log("...corporation_name..."+corporation_name);
              db.query("select customer_first_name,customer_last_name,customer_address_1,customer_email,customer_phone_1 from customer where corporation_name='"+corporation_name+"'", function (error, customeresults, fields) {
                if (error) throw error;
              customer_first_name=customeresults[0].customer_first_name;       
              customer_last_name=customeresults[0].customer_last_name;       
              customer_address=customeresults[0].customer_address_1;       
              customer_email=customeresults[0].customer_email;
              customer_phone=customeresults[0].customer_phone_1;
              //console.log("..customer_phone..."+customer_phone);
              order_id="or_"+moment(Date.now()).format('YYYYMMDD')+"_"+getdeliveryno[0].delivery_number;
              //console.log("..order_id..."+order_id);
              //console.log("....before order placement...");
              var sql = "INSERT INTO orders_placement(delivery_number,bill_of_lading_id,customer,location_id,terminal_name,user_id,order_id,store_name,delivery_amount,customer_address,customer_email,customer_phone,delivery_date,customer_first_name,customer_last_name) VALUES ('"+getdeliveryno[0].delivery_number+"','"+bill_of_lading_id+"','"+customer+"','"+location_id+"','"+terminal_name+"','"+user_id+"','"+order_id+"','"+store_name+"',"+delivery_amount+",'"+customer_address+"','"+customer_email+"','"+customer_phone+"','"+ getdeliveryno[0].delivery_date+"','"+customer_first_name+"','"+customer_last_name+"')";
              db.query(sql, function (err, result) {
                 if (err) throw err;
                 insertcount = insertcount + 1;
                 console.log("....total count......."+totalcount);
                  console.log("....insertcount......."+insertcount);
                  if (totalcount==insertcount){
                      res.send({ success: "yes" });
                  } 
                 });
              });
              //console.log("....after order placement...");
            });

          });
        });   
      });      
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
