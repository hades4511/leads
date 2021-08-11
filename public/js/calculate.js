const newsubs = {};
const prices = {};
const prevsubs = {};
const tocancel = {};
let sum = 0;
let tax = 0;
for(let one of oldsubs){
    for(oldsub of one.items.data){
        prices[oldsub.price.id] = {
            id: oldsub.price.id,
            name: oldsub.price.product.name,
            price: oldsub.price.unit_amount / 100,
        }
        prevsubs[oldsub.price.id] = {
            id: oldsub.price.id,
            subid: oldsub.subscription,
            name: oldsub.price.product.name,
            price: oldsub.price.unit_amount / 100,
        }
    }
}
showold();
calculateSum();

function showold(){
    for(sub of Object.values(prevsubs)){
        $('#subs').append(
            `<p class=${sub.id}>${sub.name}<span>$${sub.price}</span</p>`
        );
        for(price of Object.values(prices)){
            if(price.id === sub.id){
                $(`#${price.id}`)[0].checked = true;
            }
        }
    }
}


function updateprice(input){
    console.log(input.checked);
    const id = input.id;
    const name = input.name;
    const price = input.dataset.amount;
    console.log(id, newsubs, id in newsubs);
    if(input.checked){
        console.log('here');
        $('#subs').append(
            `<p class=${id}>${name}<span>$${price}</span</p>`
        );
        if(id in tocancel){
            delete tocancel[id];
        }
        else {
            newsubs[id] = {
                id: id,
                name: name,
                price: parseFloat(price),
            };
        }
        prices[id] = {
            id: id,
            name: name,
            price: parseFloat(price),
        }
        calculateSum();
    }
    else{
        if(id in prevsubs){
            tocancel[id] = prevsubs[id].subid;
        }
        $(`.${id}`).remove();
        delete newsubs[id];
        delete prices[id];
        calculateSum();
    }
    console.log(tocancel);
}

function calculateSum(){
    sum = Object.values(prices).reduce((a, b) => a + b.price, 0);
    tax = (20 / 100) * sum;
    $('#taxoutput').html(`$${tax}`);
    $('#final_price').html(`$${sum + tax}`);
}

function subscribe(){
    window.location.href = `/subscribe?new=${JSON.stringify(newsubs)}&cancel=${JSON.stringify(tocancel)}`
}


if(payments){
    stripe.confirmCardPayment(clientSecret)
    .then((result) => {
        if(result.error) {
        alert(result.error.message);
        } else {
            console.log(result);
            window.location.href = `/billing`;
        }
    });
}
