var User =require('../models/user');
var Story =require('../models/story');

var config = require('../../config');
//login
var secretKey = config.secretKey;
var jsonwebtoken = require('jsonwebtoken');

function createToken(user){
    var token = jsonwebtoken.sign({
        id:user._id,
        name:user.name,
        username:user.username
    },secretKey, {
        expiresIn: 1440
    });
    return token;
}

//test api 1.Postman choose POST URL:localhost:3000/api/signup Body:x-www-form-urlencoded type name,username,password,-send it will return message
module.exports = function(app,express,io){
    var api = express.Router();
    //post sign up

    api.get('/all_stories',function(req,res){
        Story.find({},function(err,stories){
            if(err){
                res.send(err);
                return;
            }
            res.json(stories);
        });
    });

    api.post('/signup',function(req,res){  // post to localhost:3000/api/signup
        var user = new User({
            name:req.body.name,
            username:req.body.username,
            password:req.body.password
        });

        var token = createToken(user);
        user.save(function(err){
            if(err){
                res.send(err);
                return;
            }

            res.json({
                success: true,
                message: 'User has been created',
                token: token
            });
        })
    })
    //get from database
    api.get('/users',function(req,res){
        User.find({},function(err,users){
            if(err){
                res.send(err);
                return;
            }
            res.json(users);
        });
    });

    //postman test localhost:3000/api/login  post username password
    api.post('/login',function(req,res){
        //findOne find specific object
        User.findOne({username: req.body.username
        }).select('name username password').exec(function(err,user){
            if(err) throw err;
            if(!user){
                res.send({message:"User does not exist "});
            }else if(user){
                var validPassword = user.comparePassword(req.body.password);
                if(!validPassword){
                    res.send({message:"Invalid password"});
                }else{
                    // create token, decode all of information in this token
                    //npm install jsonwebtoken --save
                    var token = createToken(user);
                    res.json({
                        success:true,
                        message:"successfuly login!",
                        token:token
                    })
                }
            }
        })
    })

    //middleware check the token
    api.use(function(req,res,next){
        console.log("somebody just came to our app!");
        var token = req.body.token || req.param('token') || req.headers['x-access-token'];
        //check if token exist
        if(token){
            jsonwebtoken.verify(token,secretKey,function(err,decoded){
                if(err){
                    res.status(403).send({success:false,message:"Failed to authenticate user"});
                }else{
                    req.decoded =decoded;
                    next();
                }
            });
        }else{
            res.status(403).send({success: false, message:"No token provided"});
        }
    });

    //Destination with middleware provide a legitimate token
    //test api login and copy assessToken, Postman GET url:localhost:3000/api/ put Headers:key: x-access-token, value: paste assessToken, you will see "hello world"
    //api.get('/',function(req,res){
    //    res.json("hello world!")
    //});

    //test localhost:3000/api/  POST body: key: content: value:hello, header: add accessToken
    api.route('/')
        .post(function(req,res){
            var story = new Story({
                creator:req.decoded.id,
                content:req.body.content,
            });
            story.save(function(err,newStory){
                if(err){
                    res.send(err);
                    return
                }
                io.emit('story',newStory)
                res.json({message:"new story created"});
            })
        })
        // test get Headers: accessToken
        .get(function(req,res){
            Story.find({creator:req.decoded.id}, function(err,stories){
                if(err){
                    res.send(err);
                    return;
                }
                res.json(stories);
            })
        });


    api.get('/me',function(req,res){
        res.json(req.decoded);
    });


    return api;
}