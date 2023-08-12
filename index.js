const {transferPurchase2} = require('./transferPurchase2');
const {transferSales} = require('./transferSales');

const CUR_PERIODE = '2023-07-%';


const main = async () => {
    console.log(`Periode ${CUR_PERIODE}`);
    // Transfer purchase
    // await transferPurchase2(CUR_PERIODE);

    // Transfer sales
    await transferSales(CUR_PERIODE);


    process.exit(0);
};


// Run the app
main();
