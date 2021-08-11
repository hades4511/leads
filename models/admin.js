const getdb = require('../utils/database').getdb;

module.exports = class Admin{
    constructor(email, password, id){
        this.email = email;
        this.password = password;
        this._id = id;
    }

    signup() {
        const db = getdb();
        return db.collection('admins').insertOne(this);
    }

    static update(admin){
        const db = getdb();
        return db.collection('admins').updateOne({email: admin.email}, { $set: admin });
    }

    static findById(email){
        const db = getdb();
        return db.collection('admins').find({email: email}).next();
    }

    static getAllUsers(){
        const db = getdb();
        return db.collection('users').find().toArray();
    }
};