
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http');
require.paths.unshift('./node_modules');

var app = module.exports = express.createServer();

var env, mongo, generate_mongo_url, mongo_url;
if(process.env.VCAP_SERVICES){
  env = JSON.parse(process.env.VCAP_SERVICES);
  mongo = env['mongodb-1.8'][0]['credentials'];
}else{
  mongo = {"hostname":"localhost","port":27017, "username":"","password":"","name":"","db":"db"};
}

generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'trailhead');

  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}

mongo_url = generate_mongo_url(mongo);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.get('/test_data',function(req,resp){
  require('mongodb').connect(mongo_url,function(err,conn){
    conn.collection('foo',function(err,coll){
      object_to_insert = { 'a' : 100 };
      coll.insert(object_to_insert,{safe:true},function(err){
        console.log(err);
        resp.writeHead(200,{'Content-Type': 'text/plain'});
        resp.write(JSON.stringify(object_to_insert));
        resp.end('\n');
      });
    });

  });

});

app.get('/load_year',function(req,resp){
  var options = {
    host: 'api.curtmfg.com',
    port: 80,
    path: '/v2/GetYear?dataType=JSON',
    method: 'GET'
  };
  http.request(options,function(resp){
    console.log('Status: '+resp.statusCode);
    resp.setEncoding('utf8');
    resp.on('data',function(chunk){
        require('mongodb').connect(mongo_url,function(err,conn){
          conn.collection('years',function(err,coll){
            var years = JSON.parse(chunk);
            for(var i = 0; i < years.length; i++){
              object_to_insert = { 'year' : years[i] };
              console.log(object_to_insert);
              coll.insert(object_to_insert,{safe:true},function(err){
                if(err !== undefined && err !== null){
                  console.log(err);
                }
              });
            } 
          });
        });
    });
  }).end();
  resp.end();
});

app.get('/years',function(req,resp){
  require('mongodb').connect(mongo_url,function(err,con){
    con.collection('years',function(err,coll){
      coll.find({},{sort:[['year','desc']]},function(err,cursor){
        cursor.toArray(function(err,items){
          for(var i = 0; i < items.length; i++){
            resp.write(JSON.stringify(items[i]) + "\n"); 
          }
          resp.end();
        });
      });
    });
  });

});

app.listen(process.env.VCAP_APP_PORT || process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
