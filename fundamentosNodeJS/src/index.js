const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Starting a server with express
const app = express();

// As a first NodeJS project, it doesn't have a database. So it'll use vector to store data
const customers = [];

// Server running on port 333
app.listen(3333);
// To use json data with express
app.use(express.json());

// A middleware to verify if an account is valid
function ifAccountIsValid(req, res, next) {
    // Get data from header request
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer){
        // Return a response to the request if customer doesn't exist, with status code 400 e a json message
        return res.status(400).json({error: 'Customer not found'})
    }

    // To attach the customer data to request
    req.customer = customer;

    // If everything is ok, go to method
    return next();
}

// A function to get balance of an account
function getBalance(statement) {
    // Get the statement, go through each operation and adding or subtracting
    const balance = statement.reduce((acc,operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

// A HTTP method to create a new account
app.post('/account', (req,res) => {
    // Get data from body of request
    const { name, cpf } = req.body;

    const cpfAlreadyUsed = customers.some(customer => customer.cpf === cpf);

    if(cpfAlreadyUsed){
        return res.status(400).json({error: "CPF already used"})
    }

    customers.push({
        name,
        cpf,
        id: uuidv4(),
        statement: []
    })

    return res.status(201).send();
})

// A HTTP method that return the account statement
app.get('/statement', ifAccountIsValid, (req,res) => {
    // Get data from request
    const { customer } = req;

    return res.json(customer.statement);
});

// A HTTP method that deposit a amount on account
app.post('/deposit', ifAccountIsValid, (req,res) => {
    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

// A HTTP method that create a withdraw on account statement
app.post('/withdraw', ifAccountIsValid, (req,res) => {
    const { customer } = req;
    const { amount } = req.body

    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return res.status(400).json({error: 'Insuficient funds!!'});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();
})


app.get('/statement/date', ifAccountIsValid, (req, res) => {
    const { customer } = req;
    const date = req.query;

    // Formato da data: aaaa-mm-dd
    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => customer.statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return response.json(statement);
})

app.put('/account', ifAccountIsValid, (req,res) => {
    const { customer } = req;
    const { name } = req.body;

    customer.name = name;

    return res.status(201).send();
})

app.get('/account', ifAccountIsValid, (req, res) => {
    const { customer } = req;

    return res.json(customer);
})

app.delete('/account', ifAccountIsValid, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(204).send();
})

app.get('/balance', ifAccountIsValid, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.json(balance);
})