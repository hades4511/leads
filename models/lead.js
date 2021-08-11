const getdb = require('../utils/database').getdb;

module.exports = class Lead{
    constructor(to, from, subject, date, source, body, id){
        this.to = to;
        this.from = from;
        this.subject = subject;
        this.date = date;
        this.source = source;
        this.body = body;
        this._id = id;
    }

    insertLead() {
        const db = getdb();
        return db.collection('leads').insertOne(this);
    }

    static findByUser(email){
        const db = getdb();
        return db.collection('leads').find({to: email}).toArray();
    }
};