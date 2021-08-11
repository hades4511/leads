const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const compression = require('compression');
const helmet = require('helmet');

const mongoConnect = require('./utils/database').MongoConnect;

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const errorcontroller = require('./controllers/errors');

const store = new MongoDBStore({
    uri: `mongodb+srv://${process.env.DATABASE_USER_NAME}:${process.env.DATABASE_USER_PASSWORD}@cluster0.7ow4b.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`,
    collection: 'sessions'
});

const server = express();

server.set('view engine', 'ejs');
server.set('views', 'views');

server.use(
    helmet.contentSecurityPolicy({
        directives: {
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://maxcdn.bootstrapcdn.com"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        imgSrc: ["'self'", "https:", "data:"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "https://maxcdn.bootstrapcdn.com"],
        upgradeInsecureRequests: [],
        },
    })
);
server.use(compression());

server.use(express.urlencoded({extended: true}));
server.use(express.static(path.join(__dirname, 'public')));

server.use(
    session({
      secret: 'my secret',
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: { secure: false, maxAge: 18000000 },
    })
);

const csrfProtection = csrf();

server.use(csrfProtection);

server.use('/admin', adminRoutes);
server.use(authRoutes);
server.use(userRoutes);

server.use(errorcontroller.get404);

mongoConnect(() => {
    server.listen(process.env.PORT || 3000);
});
