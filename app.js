'use strict'
const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('mongoose'); // mongoClient

const secret = require('./config/secret');          // secret info like db connection(has username and pass)
const vars = require('./config/vars');              // general variables
const router = require('./routes/router');

// ------------------------------------------------------------------ db connection ---------------
mongoose.Promise = global.Promise;

let _dbname = (vars.isDbLocal) ? 'local database' : 'cloud database';
if(vars.isDbLocal) { mongoose.connect(secret.db_local); } else { mongoose.connect(secret.db_cloud); }

mongoose.connection.on('connected',()=>{
   console.log('Connected to',_dbname);
});

mongoose.connection.on('error',(err)=>{
    console.log('Failed connecting to ' + _dbname + " due to:\n" + err);
});


const app = express();
app.set('port', (process.env.PORT || 3000));

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/api',router); //    {root}/api will go for router
app.get('/', (req, res)=>{ res.send('=== Reached root of the meetus, please go to /api ==='); });

/*
app.listen(3000, '0.0.0.0', function() {
    console.log('Listening to port:  ' + 3000);
});*/

app.listen(app.get('port'), '0.0.0.0', ()=>{
    console.log("App is running: port", app.get('port'));
});


//https://meetup1.herokuapp.com/api/group