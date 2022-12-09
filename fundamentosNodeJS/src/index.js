const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

const customers = [];

app.listen(3333);
app.use(express.json());

// Requisitos e regras de negócio no arquivo README.md
function ifAccountIsValid(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer){
        return res.status(400).json({error: 'Customer not found'})
    }

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc,operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

app.post('/account', (req,res) => {
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

app.get('/statement', ifAccountIsValid, (req,res) => {
    const { customer } = req;

    return res.json(customer.statement);
})

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
})

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