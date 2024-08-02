let express = require('express');
let path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { DATABASE_URL } = process.env;

let app = express()
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function getPostgresVersion() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT version()');
        console.log(res.rows[0]);
    } finally {
        client.release();
    }
}

getPostgresVersion();

app.post('/bookings', async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, email, phone, service, date, time, user_id } = req.body.content;
        console.log(req.body);

        const query = 'INSERT INTO bookings (name, email, phone, service, date, time, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const values = [name, email, phone, service, date, time, user_id];
        const result = await client.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).send('An error occurred');
    } finally {
        client.release();
    }
});



app.get('/bookings/user/:id', async (req, res) => {
    const userId = req.params.id;
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM bookings WHERE user_id = $1';
        const result = await client.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.log(err.stack);
        res.status(500).send('An error occurred');
    } finally {
        client.release();
    }
});


app.put('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const { service, date, time } = req.body;
    const client = await pool.connect();
    try {
        const updateQuery = 'UPDATE bookings SET service = $1, date = $2, time = $3 WHERE id = $4';
        const queryData = [service, date, time, id];
        await client.query(updateQuery, queryData);

        res.json({ "status": "success", "message": "Booking updated successfully" });
    } catch (err) {
        console.error(err.stack);
        res.status(500).send('An error occurred, please try again.');
    } finally {
        client.release();
    }
});

app.delete('/bookings/:id', async (req, res) => {
    const client = await pool.connect();
    const id = req.params.id;
    try {
        const query = 'DELETE FROM bookings WHERE id = $1';
        await client.query(query, [id]);
        res.json({ status: "success", message: "Booking deleted successfully" });
    } catch (err) {
        console.log(err.stack);
        res.status(500).send('An error occurred');
    } finally {
        client.release();
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
    // res.sendFile(path.join('/home/runner/restful-api-demo' + '/index.html'));
    // res.sendFile('/home/runner/restful-api-demo/index.html'));
});

// Catch 404 and forward to error handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname + '/404.html'));
});

app.listen(3000, () => {
    console.log('App is listening on port 3000');
});