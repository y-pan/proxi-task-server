'use strict'
const vars = require('./config/vars');   // general variables, settings, non-secret info
const lib = require('./lib/lib1');  // general util functions

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // mongoClient

const logger = require('morgan'); // logger

const router = require('./routes/router');
// ------------------------ start: mongo db connection --------------------
mongoose.Promise = global.Promise;
mongoose.connect(lib.getMDb()).then(()=>{
   console.log('[OK] MDB connection:',lib.getMDbType());    
}).catch((err)=>{
   console.log('[ERROR] MDB connection:',lib.getMDbType());    
});
// -------------------------- end: mongo db connection --------------------

const app = express();
app.set('port', (process.env.PORT || 3000));

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(logger('dev')); // morgan logger for all request to be logged to server console, like 


app.use('/api',router); //    {root}/api will go for router
app.get('/', (req, res)=>{ 
    // console.log('config ref...');
    res.send('=== Welcome to ProxiTask server, please go to /api ==='); 
});

app.listen(app.get('port'), '0.0.0.0', ()=>{
    console.log("[OK] App is running: port", app.get('port'));
  
});


