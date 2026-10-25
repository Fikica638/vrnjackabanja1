const express = require('express');
const mysql2 = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
const app = express();
app.use(bodyParser.json())
const JWT_SECRET = "MY_SECRET_SUPER_KEY";
const db = mysql2.createConnection({
    host:'localhost',
    user:'root',
    password:'Fiki_Pufte0545!!!*',
    database:'userzin'
});
db.connect(err=>{
    if (err) {
        console.error("Database Connection Failed", err)
    }
    else {
        console.log('Connected to Database Successfully')
    }
});
function authenticateToken(req,res,next)
{
    const authHeader=req.headers["authorization"];
    const token=authHeader&&authHeader.split(" ")[1];

if (!token) return res.status(404).send({message:"Token is Required"});
jwt.verify(token,JWT_SECRET, (err, user)=>{
    if(err) return res.status(403).send({message:"Invalid Token"});
    req.user=user;
    next()
})
}
function authorizeRoles(...allowedRoles) {
    return (req, res, next)=>{
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send({message:"Access denied! You are not authorized"});
        }
        next();
    }
}
app.post('/register', async (req, res)=>{
    const {name, email, password, age, role}=req.body;
    const hashedPassword=await bcrypt.hash(password, 10)
    const sql= 'INSERT INTO users (name, email, age, password, role) VALUES (?,?,?,?,?)';
    db.query(sql, [name, email, age, hashedPassword, role || 'user'], (err)=>{
        if(err) {
            res.status(500).send(err)
        }
        else{
            res.status(200).send({'message':"User created successfully!"})
        }
    });
});
app.post('/login', (req, res)=>{
    const {email, password}=req.body;
    const sql = 'SELECT * FROM users where email = ?';
    db.query(sql, [email], async(err, results)=>{
        if(err) {
            res.status(500).send(err)
        }
        if (results.length===0) return res.status(404).send ({message: 'User not found in RECORDS-'});
        const user= results[0];
        const match=await bcrypt.compare(password, user.password);
        if(!match) return res.status(401).send({"message":"Incorrect Credentials"});
        const token = jwt.sign(
            {
                id:user.id,
                email:user.email,
                role:user.role
            },
            JWT_SECRET,
            {
                expiresIn:"7d",
            }
        );
        res.send({message:"Login Successfull", token})
    });
});
app.get('/user/:id', (req,res)=>{
    const {id}=req.params;
    const sql = 'select * from users where id=?';
    db.query(sql, [id], (err, results)=>{
        if(err) {
            res.status(500).send(err);
        }
        else if (results.length===0) {
            res.status(404).send({message:`No user Found for the $(id)`});
        }
        else {
            res.send(result[0]);
        }
    });
});
app.post('/create-user', authenticateToken, authorizeRoles('admin'), (req, res)=>{
    const {name, email, age}=req.body;
    const sql = 'INSERT INTO users (name, email, age) VALUES (?,?,?)';
    db.query(sql, [name, email, age], (err)=>{
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(200).send({"users":results});
        }
    });
});
app.get ('/user/:id', authenticateToken, (req,res)=>{
    const {id} = req.params;
    const sql = 'select * from users where id = ?';
    db.query (sql, [id], (err, results)=>{
        if(err){
            res.status(500).send(err);
        }
        else if (results.length===0) {
            res.status(404).send({message: `No User Found for the $(id)`});
        }
        else {
            res.send(results[0]);
        }
    });
});
app.delete('/delete-user/:id', authenticateToken, authorizeRoles('admin'), (req, res)=>{
    const id = req.params;
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [id], (err, results)=>{
        if(err){
            res.status(500).send(err);
        }
        else if(result.affectedRows===0) {
            res.status(404).send({message:"User Data Not Found, so Deletion Couldn't happen."})
        }
        else {
            res.send({message:"User Deletion Successfull"});
        }
    });
});
app.put('/update-user/:id', authenticateToken, (req, res)=>{
    const {id}=req.params;
    const {name, email, age} = req.body;
    const sql = 'UPDATE users SET name = ?, email = ?, age = ? WHERE id  = ?';
    db.query(sql, [name, email, age, id], (err, result)=>{
        if(err) {
            res.status(500).send(err)
        }
        else if (result.affectedRows===0) {
            res.status(404).send({message:'User Not Found!'});
        }
        else {
            res.send({message:'User Updated Successfully!'})
        }
    });
});
const PORT=3000;
app.listen (PORT, ()=>{
    console.log('SERVER RUNNING SUCCESSFULLLY!')
})