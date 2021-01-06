require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const dns = require("dns");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urlSchema = new mongoose.Schema({
  url: String,
  shortUrl: Number
});

const Url = mongoose.model("Url", urlSchema);
let shortUrl;
Url.find({}, (err, data) => {
  if(err) res.json({"error": "invalid url"});
  else {
  shortUrl = Math.max(...data.map(i => i.shortUrl)) + 1;
  }
})

app.get("/api/shorturl/:url", (req, res) => {
  const url = Number(req.params.url);
  if(!url) {
    res.json({"error": "invalid url"})
  } else if(!!mongoose.connection.readyState) {
    Url.find({shortUrl: url}, (err, data) => {
      if(err) {
        res.json({"error": "invalid url"})
      } else {
        console.log(err, data);
        res.redirect(data[0].url)
      }
    });
  }
})

app.post("/api/shorturl/new", (req, res) => {
  const protocol = ["http","https"];
  const u = req.body.url.split(":");
  if(!protocol.includes(u[0])) {
    res.json({"error": 'invalid url'});
  }

  dns.lookup(u[1].replace(/\//g, " ").split(" ")[2], (err, address, family) => {
    if(err) {
      return res.json({"error": 'invalid url'})
    } else {
      const url = new Url({
        url: req.body.url,
        shortUrl: shortUrl++
      });
      url.save(function(err, data){
        if(err) res.json({"error": 'invalid url'})
        else {
          res.json({
            "original_url": req.body.url,
            "short_url": data.shortUrl
          })
        }
      })
    }
  });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
