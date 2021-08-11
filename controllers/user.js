const stripe = require('stripe')(process.env.STRIPE_KEY);
const bcrypt = require('bcrypt');

const User = require('../models/user');
const Lead = require('../models/lead');

const renderBill = async (req, res, payment, subscriptionId, clientSecret) => {
    const prices = await stripe.prices.list({
        limit: 5,
    });
    for(let price of prices.data){
        price.product = await stripe.products.retrieve(
            price.product
        );
    }
    const subscriptions = await stripe.subscriptions.list({
        customer: req.session.stripe_id,
    });
    for(let sub of subscriptions.data){
        for(let data of sub.items.data){
            data.price.product = await stripe.products.retrieve(
                data.price.product
            );
        }
    }
    const taxRates = await stripe.taxRates.list({
        active: true,
    });
    const paymentMethods = await stripe.paymentMethods.list({
        customer: req.session.stripe_id,
        type: 'card',
    });
    const customer = await stripe.customers.retrieve(req.session.stripe_id);
    for(let pm of paymentMethods.data){
        if(pm.id === customer.invoice_settings.default_payment_method){
            pm.isdefault = true;
            break;
        }
    }
    const invoice = await stripe.invoices.retrieveUpcoming({
        customer: req.session.stripe_id,
    });
    for(i of invoice.lines.data){
        i.price.product = await stripe.products.retrieve(
            i.price.product
        );
    }
    return res.render('billing', {
        email: req.session.email,
        prices: prices.data,
        subscriptions: subscriptions.data,
        tax: taxRates.data,
        paymentMethods: paymentMethods.data,
        payment: payment,
        subscriptionId: subscriptionId,
        clientSecret: clientSecret,
        invoice: invoice,
    });
}

exports.Dashboard = async (req, res, next) => {
    const leads = await Lead.findByUser(req.session.email);
    let email = 0, social = 0, chatbot = 0, retargeting = 0, ppc = 0;
    for(let lead of leads){
        switch(lead.source.toLowerCase().split(' ')[0]){
            case 'email':
                email++;
                break;
            case 'social':
                social++;
                break;
            case 'chatbot':
                chatbot++;
                break;
            case 'retargetting':
                retargeting++;
                break;
            case 'ppc':
                ppc++;
                break;
        }
    }
    res.render('index', {
        email: req.session.email,
        leads: leads,
        cemail: email,
        social: social, 
        chatbot: chatbot,
        retargeting: retargeting, 
        ppc: ppc,
    });
}

exports.Settings = async (req, res, next) => {
    const user = await User.findById(req.session.email);
    res.render('setting', {
        email: req.session.email,
        name: user.fullname,
        company: user.company,
        country: user.country,
        address: user.address,
        csrfToken: req.csrfToken(),
    });
}

exports.SettingsAction = async (req, res, next) => {
    const user = await User.findById(req.session.email);
    user.fullname = req.body.name;
    user.company = req.body.company;
    user.address = req.body.address;
    user.country = req.body.country;
    
    const pass = req.body.password;
    const confirm = req.body.confirm;
    
    
    if(pass === confirm){
        hashedpass = await bcrypt.hash(pass, 12);
        user.password = hashedpass;
    }

    User.update(user);
    
    res.render('setting', {
        email: req.session.email,
        name: user.fullname,
        company: user.company,
        country: user.country,
        address: user.address,
        csrfToken: req.csrfToken(),
    });
}

exports.MakeDefault = (req, res, next) => {
    stripe.customers.update(
        req.session.stripe_id,
        {invoice_settings: {default_payment_method: req.query.id}}
    );
    res.redirect('/billing');
}

exports.Billing = async (req, res, next) => {
    renderBill(req, res, '0', '', '');
}

exports.SaveCard = async (req, res, next) => {
    const paymentId = req.query.id
    const paymentMethod = await stripe.paymentMethods.attach(
        paymentId,
        {
            customer: req.session.stripe_id,
        }
    );
    const customer = await stripe.customers.retrieve(req.session.stripe_id);
    if(!customer.invoice_settings.default_payment_method){
        stripe.customers.update(
            req.session.stripe_id,
            {invoice_settings: {default_payment_method: paymentId}}
        );
    }
    res.redirect('/billing');
}

exports.Subscribe = async (req, res, next) => {
    const newsubs = Object.values(JSON.parse(req.query.new));
    const oldsubs = JSON.parse(req.query.cancel);
    Object.values(oldsubs).forEach(sub => stripe.subscriptions.del(sub));
    const customer = await stripe.customers.retrieve(req.session.stripe_id);
    if(customer.invoice_settings.default_payment_method && newsubs.length > 0){
        const taxRates = await stripe.taxRates.list({
            active: true,
        });
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: newsubs.map(obj => {
                return {
                    price: obj.id,
                    metadata: {
                        amount: obj.price,
                        name: obj.name
                    }
                }
            }),
            default_tax_rates: taxRates.data.map(tax => tax.id),
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
            default_payment_method: customer.invoice_settings.default_payment_method,
        });
        return renderBill(req, res, '1', subscription.id, subscription.latest_invoice.payment_intent.client_secret);
    }
    else res.redirect('/billing');
}
