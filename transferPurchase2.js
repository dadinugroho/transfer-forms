const { getPurchases, getExistingPurchases, getNewSuppliers, getPurchaseDetails, getNewItems } = require('./data/purchase_queries');
const helper = require('./utils/helper');

const purchSql = 'INSERT INTO `form_header` (`id`, `type`, `branchFk`, `formNo`, `formDate`, `partnerFk`, `salesmanFk`, `memo`, `printMemo`, `dueDate`, `paidDate`, `deliveryCost`, `deliveryCharge`, `discount`, `discountText`, `referenceFk`, `taxable`, `status`, `sessionNo`, `receivingMemo`, `receivingStatus`, `payment`) VALUES';
const suppSql = 'INSERT INTO `supplier` (`id`, `code`, `name`, `address`, `phone`, `description`, `taxFileNumber`, `status`) VALUES';
const detailSql = 'INSERT INTO `form_detail` (`id`, `headerFk`, `itemFk`, `type`, `quantity`, `unit`, `unitPrice`, `discount`, `taxAmount`, `discountText`, `expiredDate`, `memo`, `referenceFk`, `discRefFk`, `receivedOk`, `receivedMemo`) VALUES';
const itemSql = 'INSERT INTO `item` (`id`, `code`, `name`, `unit`, `weight`, `purchasePrice`, `salesPrice`, `minStockLevel`, `minShopLevel`, `categoryFk`, `description`, `status`) VALUES';


module.exports.transferPurchase2 = async (curPeriode) => {
    // Prepare transfer purchases
    let [purchasesMap, suppIdsArr] = await prepPurchase(curPeriode);

    // Remove duplicates
    purchasesMap = await removeDupPurchases(purchasesMap);

    // Get suppliers
    suppliersMap = await prepSuppliers(suppIdsArr);

    // Prepare details
    const [detailsMap, itemIdsArr] = await prepDetails(Array.from(purchasesMap.keys()));

    // Prepare new items
    const itemsMap = await prepItems(itemIdsArr);

    console.log(`Purchases: ${purchasesMap.size}`);
    console.log(`Suppliers: ${suppliersMap.size}`);
    console.log(`Details: ${detailsMap.size}`);
    console.log(`Items: ${itemsMap.size}`);

    // // Prepare the SQL String
    const purchSqlStr = await prepPurchaseSql(purchasesMap);

    const suppSqlStr = await prepSupplierSql(suppliersMap);

    const detailSqlStr = await prepDetailSql(detailsMap);

    const itemSqlStr = await prepItemSql(itemsMap);


    console.log();
    console.log(suppSqlStr);
    console.log();
    console.log(itemSqlStr);
    console.log();
    console.log(purchSqlStr);
    console.log();
    console.log(detailSqlStr);
    console.log();
    console.log(`Purchase IDs        : ${(Array.from(purchasesMap.keys()).join(','))}`);
    console.log(`Purchase Detail IDs : ${(Array.from(detailsMap.keys()).join(','))}`);
    console.log(`Supplier IDs        : ${(Array.from(suppliersMap.keys()).join(','))}`);
    console.log(`Item IDs            : ${(Array.from(itemsMap.keys()).join(','))}`);
};


/**
 * Preparing to get purchase ids and supplier ids
 */
const prepPurchase = async (curPeriode) => {
    let purchasesMap = new Map();
    let supplierIdsSet = new Set();

    // Prepare transfer purchases
    (await getPurchases(curPeriode)).forEach((purchase) => {
        supplierIdsSet.add(purchase.partnerFk);
        purchasesMap.set(purchase.id, purchase);
    });

    // sort in javascript by default is alphabetically, user sort( (a, b) => a - b) to sort numerically from smaller to bigger and sort( (a, b) => b - a) for bigger to smaller
    return [purchasesMap, Array.from(supplierIdsSet).sort((x, y) => x - y)];
};


/**
 * Removing the already added purchases
 */
const removeDupPurchases = async (purchasesMap) => {
    const purchIdsArr = Array.from(purchasesMap.keys());

    (await getExistingPurchases(purchIdsArr)).forEach((purchase) => {
        purchasesMap.delete(purchase.id);
    });

    return purchasesMap;
};


/**
 * Preparing to add new suppliers not yet been added
 */
const prepSuppliers = async (suppIdsArr) => {
    const suppliersMap = new Map();
    const suppliers = await getNewSuppliers(suppIdsArr);

    if (suppliers) {
        suppliers.forEach((supplier) => {
            suppliersMap.set(supplier.id, supplier);
        });
    }

    return suppliersMap;
};


/**
 * Preparing to get purchase details and item ids
 */
const prepDetails = async (purchIdsArr) => {
    let detailsMap = new Map();
    let itemIdsSet = new Set();

    // Prepare transfer purchases
    (await getPurchaseDetails(purchIdsArr)).forEach((detail) => {
        itemIdsSet.add(detail.itemFk);
        detailsMap.set(detail.id, detail);
    });

    // sort in javascript by default is alphabetically, user sort( (a, b) => a - b) to sort numerically from smaller to bigger and sort( (a, b) => b - a) for bigger to smaller
    return [detailsMap, Array.from(itemIdsSet).sort((x, y) => x - y)];
};


/**
 * Preparing to add new items not yet been added
 */
const prepItems = async (itemIdsArr) => {
    const itemsMap = new Map();
    const newItems = await getNewItems(itemIdsArr);

    if (newItems) {
        newItems.forEach((item) => {
            itemsMap.set(item.id, item);
        });
    }

    return itemsMap;
};


/**
 * Preparing Sql for Purchase
 */
const prepPurchaseSql = async (purchasesMap) => {
    let purchSqlValues = '';

    for (let purchase of purchasesMap.values()) {
        const purchFormDate = helper.toMySQLDate(purchase.formDate);
        const purchDueDate = helper.toMySQLDate(purchase.dueDate);
        const purchPaidDate = helper.toMySQLDate(purchase.paidDate);

        purchSqlValues += `\n(${purchase.id}, ${purchase.type}, ${purchase.branchFk}, '${purchase.formNo}', ${purchFormDate}, ${purchase.partnerFk}, NULL, NULL, NULL, ${purchDueDate}, ${purchPaidDate}, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, 0, NULL),`;
    }

    return (helper.isEmpty(purchSqlValues) ? '' : (purchSql + purchSqlValues.slice(0, -1) + ';'));
};


/**
 * Preparing Sql for Purchase Detail
 */
const prepDetailSql = async (detailsMap) => {
    let detailSqlValues = '';

    for (let detail of detailsMap.values()) {
        const expiredDate = helper.toMySQLDate(detail.expiredDate);

        detailSqlValues += `\n(${detail.id}, ${detail.headerFk}, ${detail.itemFk}, ${detail.type}, ${detail.quantity}, '${detail.unit}', ${detail.unitPrice / 1.11}, ${detail.discount / 1.11}, 0, '${detail.discountText}', ${expiredDate}, '', NULL, NULL, NULL, NULL),`;
    }

    return (helper.isEmpty(detailSqlValues) ? '' : (detailSql + detailSqlValues.slice(0, -1) + ';'));
};


/**
 * Preparing Sql for Supplier
 */
const prepSupplierSql = async (suppliersMap) => {
    let suppSqlValues = '';

    for (let supplier of suppliersMap.values()) {
        suppSqlValues += `\n(${supplier.id}, '${supplier.code}', '${supplier.name}', '${supplier.address}', '${supplier.phone}', '${supplier.description}', '${supplier.taxFileNumber}', ${supplier.status}),`;
    }

    return (helper.isEmpty(suppSqlValues) ? '' : (suppSql + suppSqlValues.slice(0, -1) + ';'));
};


/**
 * Preparing Sql for Item
 */
const prepItemSql = async (itemsMap) => {
    let itemSqlValues = '';

    for (let item of itemsMap.values()) {
        itemSqlValues += `\n(${item.id}, '${item.code}', '${item.name}', '${item.unit}', ${item.weight}, ${item.purchasePrice}, ${item.salesPrice}, 0, 0, ${item.categoryFk}, '', ${item.status}),`;
    }

    return (helper.isEmpty(itemSqlValues) ? '' : (itemSql + itemSqlValues.slice(0, -1) + ';'));
};
