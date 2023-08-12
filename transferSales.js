import { getPurchaseReferences, getTransactions, getCustomer, checkDupSales, checkDupSalesDetail, getOldSales, getOldSalesDetail } from './data/sales_queries';
import { toMySQLDate, isEmpty } from './utils/helper';

const headerSql = 'INSERT INTO `form_header` (`id`, `type`, `branchFk`, `formNo`, `formDate`, `partnerFk`, `salesmanFk`, `memo`, `printMemo`, `dueDate`, `paidDate`, `deliveryCost`, `deliveryCharge`, `discount`, `discountText`, `referenceFk`, `taxable`, `status`, `sessionNo`, `receivingMemo`, `receivingStatus`, `payment`) VALUES';
const custSql = 'INSERT INTO `customer` (`id`, `type`, `branchFk`, `code`, `name`, `birthDate`, `address`, `phone`, `email`, `description`, `joinDate`, `petName`, `creditLimit`, `priceGroup`, `taxFileNumber`, `status`) VALUES';
const detailSql = 'INSERT INTO `form_detail` (`id`, `headerFk`, `itemFk`, `type`, `quantity`, `unit`, `unitPrice`, `discount`, `taxAmount`, `discountText`, `expiredDate`, `memo`, `referenceFk`, `discRefFk`, `receivedOk`, `receivedMemo`) VALUES';


export async function transferSales(curPeriode) {
    // Prepare transfer purchases
    const purchDetailsMap = await getReferences(curPeriode);
    const purchDetailIdsArr = [...purchDetailsMap.keys()];

    // Get transactions
    const transactions = await getTransactions(purchDetailIdsArr);

    // Prepare sales transactions
    let [salesMap, salesDetailsMap, custMap, returnMap, returnDetailsMap, returnCustMap] = await mappingSalesTransaction(transactions, purchDetailsMap);


    console.log();
    console.log(`Sales size: ${salesMap.size}`);
    console.log();
    console.log(`Sales detail size: ${salesDetailsMap.size}`);
    console.log();
    console.log(`Customer size: ${custMap.size}`);
    console.log();
    console.log(`Customer size: ${returnCustMap.size}`);


    const newSalesIdsArr = [...salesMap.keys()];
    const oldSalesIdsArr = await getOldSales(newSalesIdsArr);

    const newDetailIdsArr = [...salesDetailsMap.keys()];
    const oldDetailIdsArr = await getOldSalesDetail(newDetailIdsArr);

    salesMap = await removeDup(salesMap, oldSalesIdsArr);
    salesDetailsMap = await removeDup(salesDetailsMap, oldDetailIdsArr);

    const [salesSqlStr, salesDetailsSqlStr, custSqlStr] = await prepareSqlString(salesMap, salesDetailsMap, custMap);

    console.log();
    console.log(custSqlStr);
    console.log();
    console.log(salesSqlStr);
    console.log();
    console.log(salesDetailsSqlStr);


    const [sales2SqlStr, salesDetails2SqlStr, cust2SqlStr] = await prepareSqlString(returnMap, returnDetailsMap, returnCustMap);

    console.log();
    console.log(cust2SqlStr);
    console.log();
    console.log(sales2SqlStr);
    console.log();
    console.log(salesDetails2SqlStr);

    console.log();
    console.log(`Sales size: ${salesMap.size}`);
    console.log();
    console.log(`Sales detail size: ${salesDetailsMap.size}`);
    console.log();
    console.log(`Customer size: ${custMap.size}`);
    console.log();
    console.log(`Customer size: ${returnCustMap.size}`);
    console.log();
    console.log(`Sales size: ${oldSalesIdsArr.length}`);
    console.log();
    console.log(`Sales detail size: ${oldDetailIdsArr.length}`);
}


/**
 * Preparing to get detail for the references
 */
const getReferences = async (curPeriode) => {
    let purchDetailIdsMap = new Map();

    // Prepare transfer purchases
    (await getPurchaseReferences(curPeriode)).forEach((detail) => {
        purchDetailIdsMap.set(detail.id, detail);
    });

    return purchDetailIdsMap;
};


/**
 * Mapping for sales, salesDetails and customers
 */
const mappingSalesTransaction = async (transactions, purchDetailsMap) => {
    try {
        let salesMap = new Map(), salesDetailsMap = new Map(), custMap = new Map();
        let returnMap = new Map(), returnDetailsMap = new Map(), returnCustMap = new Map();

        transactions.forEach(async (detail) => {
            if (2 >= detail.TipeForm) {
                // skip Form General and Form Supplier Receiving
            } else if (4 >= detail.TipeForm) {
                // Prepare salesDetail
                if (!salesDetailsMap.has(detail.ID)) {
                    salesDetailsMap.set(detail.ID, { ID: detail.ID, HeaderFk: detail.HeaderFk, ItemFk: detail.ItemFk, Sat: detail.Sat, Qty: detail.Qty, HrgSat: detail.HrgSat, Diskon: detail.Diskon, ReferenceFk: detail.ReferenceFk });

                    // then check and add HeaderFk if it is already added.
                    if (!salesMap.has(detail.HeaderFk)) {
                        salesMap.set(detail.HeaderFk, { ID: detail.HeaderFk, TipeForm: detail.TipeForm, NoForm: detail.NoForm, Tgl: detail.Tgl, CustomerFk: detail.CustomerFk, CustomerFk: detail.CustomerFk });
                    }

                    // check and update the date if it is earlier than the reference date.

                    // prepare customer
                    const cust = await getCustomer(detail.CustomerFk, detail.PartnerFk);
                    if (typeof (cust) != "undefined" && cust != null) {
                        custMap.set(cust.id, cust);
                    }
                }
            } else {
                // Prepare salesDetail
                if (!returnDetailsMap.has(detail.ID)) {
                    returnDetailsMap.set(detail.ID, { ID: detail.ID, HeaderFk: detail.HeaderFk, ItemFk: detail.ItemFk, Sat: detail.Sat, Qty: detail.Qty, HrgSat: detail.HrgSat, Diskon: detail.Diskon, ReferenceFk: detail.ReferenceFk });

                    // then check and add HeaderFk if it is already added.
                    if (!returnMap.has(detail.HeaderFk)) {
                        returnMap.set(detail.HeaderFk, { ID: detail.HeaderFk, TipeForm: detail.TipeForm, NoForm: detail.NoForm, Tgl: detail.Tgl, CustomerFk: detail.CustomerFk, CustomerFk: detail.CustomerFk });
                    }

                    // check and update the date if it is earlier than the reference date.

                    // prepare customer
                    const cust = await getCustomer(detail.CustomerFk, detail.PartnerFk);
                    if (typeof (cust) != 'undefined' && cust != null) {
                        returnCustMap.set(cust.id, cust);
                    }
                }
            }
        });

        return [salesMap, salesDetailsMap, custMap, returnMap, returnDetailsMap, returnCustMap];
    } catch (err) {
        console.log(err);
    }
};

/**
 * Preparing for sales, salesDetails and customers
 */
const prepareSqlString = async (salesMap, salesDetailsMap, custMap) => {
    let salesSqlStr = '', salesSqlValues = '';
    let salesDetailsSqlStr = '', salesDetailsSqlValues = '';
    let custSqlStr = '', custSqlValues = '';

    // Prepare customer
    for (let [key, cust] of custMap.entries()) {
        custSqlValues += `\n(${cust.id}, 'MEMBER', 1, '${cust.code}', '${cust.name}', NULL,	'',	'',	NULL,	'',	NULL,	'',	0,	NULL,	NULL,	1),`;
    }

    // Prepare sales
    for (let [key, sales] of salesMap.entries()) {
        salesSqlValues += `\n(${sales.ID}, 4, 19, '${sales.NoForm}', ${toMySQLDate(sales.Tgl)}, ${sales.CustomerFk}, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, 0, NULL),`;
    }

    // Prepare salesDetail
    for (let [key, detail] of salesDetailsMap.entries()) {
        salesDetailsSqlValues += `\n(${detail.ID}, ${detail.HeaderFk}, ${detail.ItemFk}, -1, ${detail.Qty}, '${detail.Sat}', ${detail.HrgSat/1.11}, ${detail.Diskon/1.11}, 0, NULL, NULL, NULL, ${detail.ReferenceFk}, NULL, NULL, NULL),`;
    }

    custSqlStr = (isEmpty(custSqlValues) ? '' : (custSql + custSqlValues.slice(0, -1) + ';'));

    salesSqlStr = (isEmpty(salesSqlValues) ? '' : (headerSql + salesSqlValues.slice(0, -1) + ';'));

    salesDetailsSqlStr = (isEmpty(salesDetailsSqlValues) ? '' : (detailSql + salesDetailsSqlValues.slice(0, -1) + ';'));


    return [salesSqlStr, salesDetailsSqlStr, custSqlStr];
};


/**
 * Removing duplicates
 */
const removeDup = async (theMap, theOldIdsArr) => {
    theOldIdsArr.forEach((oldId) => theMap.delete(oldId));

    return theMap;
}
