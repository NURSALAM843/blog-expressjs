const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blog'
});

//express-session, penggunaan session pada expressjs, cara install npm install express-session
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req,res,next) => {
  if (req.session.userId === undefined) {
    console.log('Anda tidak login');
    res.locals.username = "Tamu";
    res.locals.isLoggedIn = false;
  } else {
    console.log('Anda telah login');
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
    // const username = req.session.username;
  }
  next();
});

// Ini adalah path route untuk halaman Teratas
// Pastikan URL dan code untuk menampilkan halaman-nya
app.get('/', (req, res) => {
  res.render('top.ejs');
});

// Ini adalah path route untuk halaman Artikel
// Pastikan URL dan code untuk menampilkan halaman-nya
app.get('/list', (req, res) => {
  // if(req.session.userId === undefined){
  //   console.log('Anda tidak login');
  // }else{
  //   console.log('Anda telah login');
  // }
  connection.query(
    'SELECT * FROM articles',
    (error, results) => {
      // Pastikan data dan nama property diberikan pada file EJS
      res.render('list.ejs', { articles: results });
    }
  );
});

// Ini adalah path route untuk halaman Detail Artikel
// Pastikan URL dan code untuk menampilkan halaman-nya
app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM articles WHERE id = ?',
    [id],
    (error, results) => {
      // Pastikan data dan nama property diberikan pada file EJS
      res.render('article.ejs', { article: results[0] });
    }
  );
});

// route pendaftaran akun
app.get('/signup', (req,res) => {
  //{errors:[]} berfungsi menerukan errors array kosong
  res.render('signup.ejs', {errors:[]});
});

app.post('/signup', 
(req,res,next) =>{
  console.log('Pemeriksaan nilai input kosong');
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const errors = [];
  if (username === ''){
    errors.push('Nama pengguna kosong');
  }
  if(email === ''){
    errors.push('Email kosong');
  }
  if(password === ''){
    errors.push('Kata Sandi kosong');
  }
  console.log(errors);

  if(errors.length>0){
    //{errors: errors} Meneruskan pesan-pesan error ke halaman pendaftaran
    res.render('signup.ejs',{errors: errors});
  }else{
    next();
  }
},
(req,res,next) => {
  const email = req.body.email;
  const errors =[];
  connection.query(
    'SELECT * FROM users WHERE email = ?', [email],
    (error,results) => {
      if(results.length > 0 ){
        errors.push('Gagal mendaftarkan pengguna');
        res.render('signup.ejs',{errors: errors});
      }else{
        next();
      }
    }
  );
},
(req,res) => {
  console.log('Pendaftaran');
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  bcrypt.hash(password,10,(error, hash) => {
    connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hash],
      (error, results) => {
        req.session.userId = results.insertId;
        req.session.username = username;
        // Tambahkan code untuk melakukan redirect menuju ke halaman Artikel
        res.redirect('/list');
      }
    );
  });

});

//route login untuk menuju halaman login
app.get('/login',(req,res) =>{
  res.render('login.ejs');
});

//route login untuk logika login
app.post('/login', (req,res) => {
  const email = req.body.email;
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      // Pisahkan proses berdasarkan banyaknya element-element dalam array `results`
      if(results.length > 0){
        const plain = req.body.password;
        const hash = results[0].password;
        bcrypt.compare(plain,hash, (error, isEqual) => {
          //login pakai hash, if yang dikomentari di bawah login tanpa hash
          if(isEqual){
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            res.redirect('/list');
          }else{
            res.redirect('/login');
          }
        });
        
        // if(req.body.password === results[0].password){
        //   req.session.userId = results[0].id;
        //   req.session.username = results[0].username;
        //   res.redirect('/list');
        // }else{
        //   console.log('Autentikasi gagal');
        //   res.redirect('/login');
        // }
      }else{
        res.redirect('/login');
      }
    }
   );
});

app.get('/logout', (req,res) => {
  req.session.destroy((error) => {
    res.redirect('/list');
  });
});


app.listen(3000);
