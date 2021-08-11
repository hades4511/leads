const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const MongoConnect = callback =>{
    MongoClient.connect(
        `mongodb+srv://${process.env.DATABASE_USER_NAME}:${process.env.DATABASE_USER_PASSWORD}@cluster0.7ow4b.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`,
        { useUnifiedTopology: true }
        )
        .then(client => {
            console.log("Connected");
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err)
            throw err;
        });
};

const getdb = () => {
    if(_db)
        return _db;
    else throw "no db found";
}

exports.MongoConnect = MongoConnect;
exports.getdb = getdb;
