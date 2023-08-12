require('dotenv').config();

const mysql = require('mysql2/promise');

// petshop
module.exports.knex1 = require('knex')({
        client: 'mysql2',
        connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.DB_1
        },
        // debug: true
});

// petppn
module.exports.knex2 = require('knex')({
    client: 'mysql2',
    connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_2
    },
//     debug: true
});


// const GENERAL = 1;
// const SUPPLIER_RECEIVING = 2;
// const BRANCH_TRANSFER = 3;
// const WAREHOUSE_SALES = 4;
// const SUPPLIER_RECEIVING_RETURN = 5;
// const BRANCH_TRANSFER_RETURN = 6;
// const WAREHOUSE_SALES_RETURN = 7;
// const WAREHOUSE_OPNAME = 8;
// const WAREHOUSE_TRANSFER = 9;
// const SHOP_SALES = 10;
// const SHOP_REPACK = 11;
// const SHOP_OPNAME = 12;