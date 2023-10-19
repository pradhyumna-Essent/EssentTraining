import express from 'express';
import bodyParser from 'body-parser';
import accountRouter from './controllers/accounts';
import productRouter from './controllers/products';

const app = express();

// Set the response header Content-Type to application/json
app.set('Content-Type', 'application/json');

// Parse the request body in JSON format
app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));

// Set the routes
app.use('/', accountRouter);
app.use('/', productRouter);

// Define a default route
app.get('/', (req, res) => {
  res.send({ message: 'welcome' });
});

// Start the server
const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, host, () => {
  console.log(`Server listening on port ${port}`);
});
