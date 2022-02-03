/*********************************************************************************
* BTI325 – Assignment 5
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Michal Kot-Kawula Student ID: 128945193 Date: 12/09/2020
*
* Online (Heroku) Link: https://blooming-headland-09678.herokuapp.com/
*
********************************************************************************/ 

var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var path = require ("path");
var dataZ = require('./data-services.js');
var bodyParser = require('body-parser');
var clientSessions = require("client-sessions");
const dataAuth = require("./data-service-auth.js");
const fs = require('fs');
app.use(bodyParser.urlencoded({extended: true}));
const multer = require('multer');
const exphbs = require('express-handlebars');
//multer
//////////////////////////////////////////////////

const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
//////////////////////////////////////////////////


//session
app.use(clientSessions({
  cookieName: "session", 
  secret: "sceretMK1", 
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60 
}));

//hbs engine
app.engine('.hbs', exphbs({
  extname:".hbs",
  defaultLayout: 'main',
  helpers :
  {equal: (lvalue, rvalue, options) => {
      if (arguments.length < 3)
      throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
          return options.inverse(this);
      } 
      else {
          return options.fn(this);
      }},
      navLink: (url, options) => {
          return '<li' +((url == app.locals.activeRoute) ? ' class="active" ' : '') +'><a href="' + url + '">' + options.fn(this) + '</a></li>';
      }
  }  
})); 
  
  app.set('view engine', '.hbs');
  app.use(express.static('public')); 
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());


/// start
function onHttpStart() {
    console.log('Express http server listening on: ' + HTTP_PORT);
  }


// adequate route function
  app.use(function(req,res,next){ 
    res.locals.session = req.session; //session addition
    let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();

});

//home
app.get("/", (req, res) => {
    res.render('home')
});

//about
app.get('/about', function (req, res) {
  res.render('about');
});


/////////////////////////////////////////////LOGIN + LOGOUT////////////////////////////////////////////////

//ensureLogin Function
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }}

//login GET
app.get("/login", function(req,res){
  res.render("login");

})

//logout GET
app.get("/logout", function(req, res){
  req.session.reset();
  res.redirect("/");
});

//login POST
app.post("/login", (req, res) => {

  req.body.userAgent = req.get('User-Agent');

  dataAuth.checkUser(req.body)

  .then((user) => {
      req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory
      }
      res.redirect("/employees");
  })

  .catch((error) => {
      res.render("employees", {message: error, userName: req.body.userName});
  });
});
/////////////////////////////////////////////LOGIN////////////////////////////////////////////////

/////////////////////////////////////////////REGISTER////////////////////////////////////////////////

//register GET
app.get("/register", function(req,res){
res.render("register");
})


//register POST
app.post("/register", (req, res) => {
  dataAuth.registerUser(req.body)
  .then(() => {
      res.render("register", { successMessage: "User Created" });
  })
  .catch((error) => {
      res.render("register", { errorMessage: error, userName: req.body.userName });
  });
});
/////////////////////////////////////////////REGISTER////////////////////////////////////////////////


//userHistory GET
app.get("/userHistory", ensureLogin,function(req,res){
  res.render("userHistory");
});


/////////////////////////////////////////////EMPLOYEES////////////////////////////////////////////////

//GET employee
app.get("/employees", ensureLogin, function(req,res){

if(Object.keys(req.query).length === 0){ 
  dataZ.getAllEmployees().then(function(data){

      if (data.length > 0){
        res.render("employees", {data : data});
      }
      else{
        res.render("employees", {data : "No results"});
      }
  })
  .catch(function(){
     res.render("Error getting employees");
  })
}
else if (Object.keys(req.query).length !== 0){
  dataZ.getEmployees(req.query).then(function(data){
    res.render("employees", {data : data});
 
  }).catch(function(err){
    res.render("employees" , {error: err});
  })
}
})


//add employee GET
app.get("/employees/add", ensureLogin, function(req,res){

dataZ.getDepartments().then(function(passed_dept){
  res.render("addEmployee", {departments : passed_dept});
 
}).catch(function(){
  res.render("Error adding employee ");
})
})


//GET employee by number
app.get("/employees/:num", ensureLogin, function(req, res){

let myData = {};
dataZ.getEmployees(req.params).then((data) => {
    if (data) {
        myData.employee = data; 
    } else {myData.employee = null;  }

}).catch(() => {
    myData.employee = null; 
}).then(dataZ.getDepartments)
.then((data) => {
    myData.departments = data; 

    for (let i = 0; i < myData.departments.length; i++) {
        if (myData.departments[i].departmentId == myData.employee[0].dataValues.department) {
            myData.departments[i].selected = true;
        }
    }

}).catch(() => {
    myData.departments = []; 
}).then(() => {
    if (myData.employee == null) { 
        res.status(404).send("Employee Not Found");
    } else {
        res.render("employee", { myData: myData }); 
    }
})
})


//delete employee by number GET
app.get('/employee/delete/:employeeNum', ensureLogin, function(req, res){

      dataZ.deleteEmployeeByNum(req.params).then(function(){
        res.redirect("/employees")
      }).catch(function(err){
        res.send("Error deleting employee by number");
      })
});


//update Employee POST
app.post("/employee/update",  ensureLogin,function(req,res){
 
  dataZ.updateEmployee(req.body).then(function(){

      res.redirect("/employees");
  }).catch((err)=>{
    res.status(500).send("Employee Not Found");
  })

})



//add employee POST
app.post("/employees/add",  ensureLogin,function(req,res){

    dataZ.addEmployee(req.body).then(function(data){
        res.redirect("/employees");
    }).catch(function(){
      res.send("Error adding employee POST");

    })

})
/////////////////////////////////////////////EMPLOYEES////////////////////////////////////////////////


/////////////////////////////////////////////MANAGERS////////////////////////////////////////////////
//GET managers
app.get("/managers", ensureLogin, function(req, res){

  dataZ.getManagers().then(function(data){
  
    if (data.length > 0){
      res.render("managers", {data : data});
    }

    else{ res.render("managers", {data : "No results"});}
})
.catch(function(){
   res.render("Couldn't get managers");
})
})
/////////////////////////////////////////////MANAGERS////////////////////////////////////////////////


/////////////////////////////////////////////DEPARTMENTS////////////////////////////////////////////////
//get departments
app.get("/departments", ensureLogin, function(req, res){

  dataZ.getDepartments().then(function(data){

    if (data.length > 0){
      res.render("departments", {data : data}); }
    else{ res.render("departments", {data : "No results"});}
    
})
.catch(function(){
    res.render("Couldn't get departments");
})

})

// GET department by ID
app.get("/department/:departmentId", ensureLogin, function(req,res){
  dataZ.getDepartmentById(req.params).then(function(dept){
     res.render("department", {data: dept})
  
  }).catch(function(){
    res.send("error getting apartment by ID");
  })
  })

//add department GET
app.get("/departments/add", ensureLogin, function(req,res){
  res.render("addDepartment");
})

//add department POST
app.post("/departments/add", ensureLogin, function(req,res){

  dataZ.addDepartment(req.body).then(function(){
      res.redirect("/departments");
  }).catch(function(){
  
    res.send("error post department add" ); 
  }) 
  })

//update department POST
app.post("/department/update", ensureLogin, function(req,res){

  dataZ.updateDepartment(req.body).then(function(){
    res.redirect("/departments")
  }).catch(function(){
    res.send("error updating department");
  })

})
/////////////////////////////////////////////DEPARTMENTS////////////////////////////////////////////////





/////////////////////////////////////////////IMAGES////////////////////////////////////////////////
// Add image GET
app.get("/images/add", ensureLogin, function(req,res){
res.render("addImage")
})

//Add image POST
app.post("/images/add",  ensureLogin,upload.single("imageFile"), function(req, res){
  res.redirect("/images")
});


// GET images
app.get("/images",  ensureLogin, function(req, res){
    fs.readdir("./public/images/uploaded", function(err, items){
      res.render("images", {data: items});
       if (err){
        res.send("error getting images");
       }
    })

})


/////////////////////////////////////////////IMAGES////////////////////////////////////////////////



//404 error
app.get('*', function(req, res){
    res.status(404).send('Error 404');
  });

//CSS
app.use( express.static(path.join(__dirname, '/public/css/site.css')))

// setup http server to listen on HTTP_PORT + update for data-service-auth
dataZ.initialize()
.then(dataAuth.initialize)
.then(function() {
	app.listen(HTTP_PORT, onHttpStart)
})
.catch(function(rejectMsg) {
	console.log(rejectMsg);
});