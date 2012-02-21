
/*
 * GET home page.
 */

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

exports.index = function(req, res){
  console.log('hit function');
  require('mongodb').connect(mongo_url,function(err,con){
  	con.collection('foo',function(err,coll){
  		coll.find({},{limit:10, sort:[['_id','desc']]},function(err,cursor){
  			cursor.toArray(function(err,items){
  				console.log(err);
  				console.log(items);
  				for(var i = 0; i < items.length; i++){
  					console.log(items[i]);
  					res.write(JSON.stringify(items[i]) + "\n");	
  				}
  			});
  		});
  	});
  });
  res.render('index', { title: 'Trailhead Pottery' })
};