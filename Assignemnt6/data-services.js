var exports = module.exports = {};

const Sequelize = require('sequelize');

var sequelize = new Sequelize('d4q40nb1akm9fh', 'ihvkrwsqkvwjmq', 'b872b530cbded98e2bdee12c635cc435544c938759ed7bca176ee1128d2e8d62', {
    host: 'ec2-52-5-176-53.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {ssl: {
        require: true,
        rejectUnauthorized: false
    } }});

 sequelize.authenticate().then(()=>console.log('Connection success.')).catch((err)=>console.log("Unable to connect to DB.", err));

 var Employee = sequelize.define('Employee',{

    empNum : {
        
        type: Sequelize.INTEGER,
        autoIncrement : true,
        primaryKey : true    },
    
    firstName          : Sequelize.STRING,
    lastName           : Sequelize.STRING,
    email              : Sequelize.STRING,
    SSN                : Sequelize.STRING,
    addressStreet      : Sequelize.STRING,
    addressCity        : Sequelize.STRING,
    addressState       : Sequelize.STRING,
    addressPostal      : Sequelize.STRING,
    isManager          : Sequelize.BOOLEAN,
    employeeManagerNum : Sequelize.INTEGER,
    status             : Sequelize.STRING,
    department         : Sequelize.INTEGER,
    hireDate           : Sequelize.STRING

 });


 //initialize
exports.initialize = function(){

    return new Promise(function(resolve, reject){

            sequelize.sync().then(function(){
                    resolve();
            }).catch(function(){
                reject("unable to sync the database")
            })       
        })
    }


//getAllEmployees
 exports.getAllEmployees = function(){

        return new Promise(function(resolve , reject){

            sequelize.sync().then(function(){

                Employee.findAll({order: ['empNum']}).then(function(array_of_emps){

                        resolve(array_of_emps);
                }).catch(function(){
                    reject("no results returned")
                })
         })
        })
}

//get employees
//includes:
//getEmployeesByStatus(status)
//getEmployeesByDepartment(department)
//getEmployeesByManager(manager)
//getEmployeeByNum(num)
exports.getEmployees = function(pass){

    var match;
   
    ////getEmployeesByStatus(status)
    if (pass.status !== undefined){
       match = {status : pass.status}     
    }

    ////getEmployeeByNum(num)
    else if(pass.num !== undefined){
        match = {empNum : pass.num }
    }

     ////getEmployeesByManager(manager)
     else if(pass.manager !== undefined){
        match = {hasManager : pass.manager};
    }

    ////getEmployeesByDepartment(department)
    else if(pass.department !== undefined){
        match = {department : pass.department};    
    }

    return new Promise(function(resolve,reject){

            sequelize.sync().then(function(){
                Employee.findAll({where : match, order : ['empNum']}).then(function(array_of_emps){
                        resolve(array_of_emps);
                }).catch(function(){
                        reject("No results found for : " +  match)
                })
            })
    })
}

//get managers
exports.getManagers = function(){
    
    return new Promise(function(resolve, reject){
        sequelize.sync().then(function(){
            Employee.findAll({where : {isManager : true}, order : ['empNum']}).then(function(array_of_mangers){
                resolve(array_of_mangers);
            }).catch(function(){
                reject("Cannot get managers")
            })
        })
    })
}

//getDepartments
exports.getDepartments = function(){


    return new Promise(function(resolve , reject){

        sequelize.sync().then(function(){

            Department.findAll({order : ['departmentId']}).then(function(array_of_depts){

                    resolve(array_of_depts);

            }).catch(function(){
                        reject( "no results returned")
            })
        })
    })
}

//define department
var Department = sequelize.define('Department', {


    departmentId : {
        type : Sequelize.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    departmentName : Sequelize.STRING
 })

 //quick check
var CheckIFexists = function(emp){

    for (doesExist in emp){
        if (doesExist === ""){
            doesExist = null;
        }}}


//add employee
exports.addEmployee = function(employeeData){

    return new Promise(function(resolve, reject){

        sequelize.sync().then(function(){
            CheckIFexists(employeeData); 
            Employee.create({
               
                firstName : employeeData.firstName ? employeeData.firstName  : null,
                lastName : employeeData.lastName ? employeeData.lastName : null,
                email : employeeData.email ? employeeData.email : null,
                SSN : employeeData.SSN ? employeeData.SSN : null,
                addressStreet : employeeData.addressStreet ? employeeData.addressStreet : null,
                addressCity : employeeData.addressCity ? employeeData.addressCity : null,
                addressState: employeeData.addressState ? employeeData.addressState : null,
                addressPostal : employeeData.addressPostal ? employeeData.addressPostal : null,
                isManager : employeeData.isManager ? false : true,
                employeeManagerNum : employeeData.employeeManagerNum ? employeeData.employeeManagerNum : null,
                status : employeeData.status ? employeeData.status : null,
                department : employeeData.department ? employeeData.department : null,
                hireDate : employeeData.hireDate ? employeeData.hireDate : null    

            }).then(function(newEmp){
                    resolve(newEmp);
            }).catch(function(){
                reject("unable to create employee")
            })
        })
    }) 
}



//update employee
exports.updateEmployee = function(employeeData){
   
    return new Promise(function(resolve, reject){

     sequelize.sync().then(function(){

      CheckIFexists(employeeData); 

        Employee.update({

            firstName : employeeData.firstName ? employeeData.firstName : null,
            lastName : employeeData.lastName ? employeeData.lastName : null,
            email : employeeData.email ? employeeData.email : null,
            SSN : employeeData.SSN ? employeeData.SSN : null,
            addressStreet : employeeData.addressStreet ? employeeData.addressStreet : null,
            addressState: employeeData.addressState ? employeeData.addressState : null,
            addressPostal : employeeData.addressPostal ? employeeData.addressPostal : null,
            addressCity : employeeData.addressCity ? employeeData.addressCity : null,
            isManager : employeeData.isManager ? false : true,
            employeeManagerNum : employeeData.employeeManagerNum ? employeeData.employeeManagerNum : null,
            status : employeeData.status ? employeeData.status : null,
            department : employeeData.department ? employeeData.department : null,
            hireDate : employeeData.hireDate ? employeeData.hireDate : null

        }, {where : {empNum : employeeData.employeeNum}}).then(function(){
            resolve();
        }).catch(function(){
            reject( "unable to update employee");
        })
     })       
    })
}

//delete Employee by number
exports.deleteEmployeeByNum = function(employeeData){

    return new Promise(function(resolve, reject){

        sequelize.sync().then(function(){

            Employee.destroy({where : {empNum : employeeData.employeeNum}}).then(function(){
                resolve();
            }).catch(function(){
                reject("Error cannot delete employee by number");
            })
        })
    })
}

//get department by id
exports.getDepartmentById = function(id){

    return new Promise(function(resolve, reject){
        sequelize.sync().then(function(){
            Department.findAll({where : {departmentId : id.departmentId}}).then(function(dept_obj){
                    resolve(dept_obj[0]);
            }).catch(function(){
                reject("no results returned");
            })
        })
    })
}


//add Department
exports.addDepartment = function(departmentData){

    return new Promise(function(resolve, reject){    
        sequelize.sync().then(function(){
            CheckIFexists(departmentData);
            Department.create({
                departmentName : departmentData.departmentName
            }).then(function(dept_obj){
                resolve();
            }).catch(function(){
                reject("unable to create department");
            })
        })
    })
}

//update department
exports.updateDepartment = function(departmentData){   
    return new Promise(function(resolve, reject){
        sequelize.sync().then(function(){
            console.log(departmentData);
            Department.update({
 
                departmentName : departmentData.departmentName
    
            }, {where : {departmentId : departmentData.departmentId}}).then(function(){
                resolve()
            }).catch(function(){
                reject("unable to update department");
            })
        })
    })
}



