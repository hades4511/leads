const getdb = require('../utils/database').getdb;

module.exports = class User{
    constructor(fullname, email, password, id){
        this.fullname = fullname;
        this.email = email;
        this.password = password;
        this._id = id;
        this.company = '';
        this.country = '';
        this.address = '';
    }

    signup() {
        const db = getdb();
        return db.collection('users').insertOne(this);
    }

    static update(user){
        const db = getdb();
        return db.collection('users').updateOne({email: user.email}, { $set: user });
    }

    static addStripeId(id, stripe_id){
        const db = getdb();
        return db.collection('users').updateOne({_id: id}, {'$set' : {'stripe_id' : stripe_id }})
    }

    static findById(email){
        const db = getdb();
        return db.collection('users').find({email: email}).next();
    }

    static findByToken(token){
        const db = getdb();
        return db.collection('users').find({token: token, tokenExpiry: { $gt : Date.now() }}).next();
    }

    static findByTokenEmail(token, email){
        const db = getdb();
        return db.collection('users').find({token: token, email: email, tokenExpiry: { $gt : Date.now() }}).next();
    }
};