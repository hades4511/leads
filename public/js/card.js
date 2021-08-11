const stripe = Stripe('pk_test_51JJa1ZIJLhtTHHxwDxIIyXNJCIxNFrKkYp92Cwm633wXZPFsdiTyW7CwFjdzNaWVIhyZUTvsImc6cpgbPXt8Jur000HLbxJiqZ');
      
const elements = stripe.elements();
var elementStyles = {
base: {
    'width': '100%',
    'border': 0,
    'borderRadius': '50px',
    'backgroundColor': '#243546',
    'color': '#fff',
    'marginBottom': '25px',

    '::placeholder': {
    color: '#CFD7DF',
    },
    ':-webkit-autofill': {
    color: '#e39f48',
    },
},
invalid: {
    color: '#E25950',

    '::placeholder': {
    color: '#FFCCA5',
    },
},
};

var elementClasses = {
    focus: 'focused',
    empty: 'empty',
    invalid: 'invalid',
};
const cardNumber = elements.create('cardNumber', {
    style: elementStyles,
    classes: elementClasses
});
cardNumber.mount('#card-number');

const cardExpiry = elements.create('cardExpiry', {
    style: elementStyles,
    classes: elementClasses
});
cardExpiry.mount('#card-expiry');

const cardCvc = elements.create('cardCvc', {
    style: elementStyles,
    classes: elementClasses
});
cardCvc.mount('#card-cvc');


const cardButton = document.getElementById('card-button');
cardButton.addEventListener('click', async (ev) => {
    const result = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        // billing_details: {
        //     name: cardholderName.value,
        // },
    });

    if (result.error) {
        // Display error.message in your UI.
        
    } else {
        // You have successfully created a new PaymentMethod
        // resultContainer.textContent = "Created payment method: " + result.paymentMethod.id;
        window.location.href = `/save?id=${result.paymentMethod.id}`;
    }
});

function makedefault(id){
    window.location.href = `/makedefault?id=${id}`;
}
