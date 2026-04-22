const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || ''
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'secure_messaging'}\`;`);
    console.log('Database created or already exists.');
    await connection.end();
    process.exit(0);
}

setup().catch(err => {
    console.error('Error creating database:', err);
    process.exit(1);
});
