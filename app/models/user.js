var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

//create UserSchema object
var UserSchema = new Schema({
    name: String,
    //unique:true means no duplicated, select: false means require user, require password as well
    username:{type: String, required:true, index:{unique:true}},
    password:{type: String, required:true, select: false}
});


//hash password
UserSchema.pre('save', function(next){
    //this is refering object UserSchema
    var user = this;
    //do some validation, if true, goto next
    if(!user.isModified('password'))
        return next();
    //npm install bcrypt-nodejs --save which will handel hashing
    bcrypt.hash(user.password,null, null, function(err,hash){
        if(err) return next(err); // if err, goto next matching round
        user.password = hash;
        next(); // go to next matching round
    });
});

// create custom method for UserSchema object, compare typing password with database
UserSchema.methods.comparePassword = function(password){
    var user = this;
    return bcrypt.compareSync(password,user.password);//user.password is in database
}

//exports User object
module.exports = mongoose.model('User', UserSchema);



