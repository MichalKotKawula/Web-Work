var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");

var Schema = mongoose.Schema;

//schema
var userSchema =  new Schema({
    "userName": {
    "type" : String,
    "unique" : true 
    },
    "password":String,
    "email":String,
    "loginHistory" : [{  
    "dateTime" : Date,
    "userAgent" :  String
    }]
});

//export modeules
var exports = module.exports = {};
let User;

//empty or space detect
function EmptORSpaces(str){ 
    return str === null || str.match(/^ *$/) !== null;
}

//initalize
exports.initialize = function(){
    return new Promise(function(resolve, reject){
   
        let db = mongoose.createConnection("mongodb+srv://mkot-kawula:@senecaweb.hxxux.mongodb.net/web322_week8?retryWrites=true&w=majority", { useNewUrlParser: true }); //connect to database
        
        db.on('error', function(err){ 
            reject("db error! " + err);
        })
        db.once('open', function(){     
            console.log("DB connection success!");
           User = db.model("users", userSchema);
            resolve();
        })
    })
};


//register user    
exports.registerUser = function(userData){

    return new Promise(function(resolve,reject){

        if (EmptORSpaces(userData.password)){ 
            reject("Error: Password cannot be empty or only white spaces!");
        }
        if (userData.password != userData.password2){
            reject("Error: Passwords do not match");
        }
        if (EmptORSpaces(userData.userName)){ 
            reject("Error: user name or password cannot be empty or only white spaces!");
        }
       
            var newUser = new User(userData);
    bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(er, hash) { 
      

        if (!er){
            newUser.password = hash;
            newUser.save((err) => {
                if (err && err.code == "11000") {
                    reject(" User Name already taken");
                }
            if(err) {
                reject(err);
            } else {
                    resolve();
            }
            });
        }
        else{
            reject();
        }
    });
    });
 })}


 //check user
exports.checkUser = function(userData){

    return new Promise(function(resolve,reject){

        User.findOne({userName : userData.userName}).exec()
        .then(function(foundUser){  
            if (foundUser){
                bcrypt.compare(userData.password, foundUser.password)
                .then(function(isMatch){
                    if (isMatch == false){
                        reject("Passwords do not match");
                    }
                    else{ 
                        foundUser.loginHistory.push({dataTime : new Date().toString(), userAgent : userData.userAgent});
                        User.update({userName : foundUser.userName},  
                            { $set: {loginHistory: foundUser.loginHistory}}, 
                            { multi: false}).exec().then(function(){
                                resolve(foundUser);
                            }).catch(function(err){
                                    reject("Could not verify user: " + err);
                            })
                    }
                 }).catch(function(err){
                     reject("Error : "  + err);
                 })
            }
            else{
               reject( userData.userName + " user was not found in database");
            }
        }).catch(function(err){
                reject("Unable to find user : " + userData.userName);
        });
    })

}
