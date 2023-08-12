const { getPurchases, getNewSuppliers, getPurchaseDetails, getNewItems } = require('./data/purchase_queries');
const helper = require('./utils/helper');

const purchSql = 'INSERT INTO `form_header` (`id`, `type`, `branchFk`, `formNo`, `formDate`, `partnerFk`, `salesmanFk`, `memo`, `printMemo`, `dueDate`, `paidDate`, `deliveryCost`, `deliveryCharge`, `discount`, `discountText`, `referenceFk`, `taxable`, `status`, `sessionNo`, `receivingMemo`, `receivingStatus`, `payment`) VALUES';
const suppSql = 'INSERT INTO `supplier` (`id`, `code`, `name`, `address`, `phone`, `description`, `taxFileNumber`, `status`) VALUES';
const purchDetailSql = 'INSERT INTO `form_detail` (`id`, `headerFk`, `itemFk`, `type`, `quantity`, `unit`, `unitPrice`, `discount`, `taxAmount`, `discountText`, `expiredDate`, `memo`, `referenceFk`, `discRefFk`, `receivedOk`, `receivedMemo`) VALUES';
const itemSql = 'INSERT INTO `item` (`id`, `code`, `name`, `unit`, `weight`, `purchasePrice`, `salesPrice`, `minStockLevel`, `minShopLevel`, `categoryFk`, `description`, `status`) VALUES';


module.exports.transferPurchase = async (curPeriode) => {
    // Prepare transfer purchases
    const [purchSqlStr, purchIdsArr, suppIdsArr] = await prepPurchase(curPeriode);

    // Prepare new suppliers
    const [suppSqlStr, newSuppIdsArr] = await prepSupplier(suppIdsArr);

    // Prepare details
    const [purchDetailSqlStr, purchDetailIdsArr, itemIdsArr] = await prepPurcaseDetail(purchIdsArr);

    // Prepare new items
    const [itemSqlStr, newItemIdsArr] = await prepItem(itemIdsArr);

    console.log();
    console.log(suppSqlStr);
    console.log();
    console.log(itemSqlStr);
    console.log();
    console.log(purchSqlStr);
    console.log();
    console.log(purchDetailSqlStr);
    console.log();
    console.log(`Purchase IDs        : ${purchIdsArr.join(',')}`);
    console.log(`Purchase Detail IDs : ${purchDetailIdsArr.join(',')}`);
    console.log(`Supplier IDs        : ${suppIdsArr.join(',')}`);
    console.log(`New Supplier IDs    : ${newSuppIdsArr.join(',')}`);
    console.log(`Item IDs            : ${itemIdsArr.join(',')}`);
    console.log(`New Item IDs        : ${newItemIdsArr.join(',')}`);
};


/**
 * Preparing to get purchase ids and supplier ids in addition to prepare the purchase sql statement.
 */
const prepPurchase = async (curPeriode) => {
    let purchIdsArr = [];
    let supplierIdsSet = new Set();
    let purchSqlStr = '', purchSqlValues = '';

    // Prepare transfer purchases
    (await getPurchases(curPeriode)).forEach((purchase) => {
        purchIdsArr.push(purchase.id);
        supplierIdsSet.add(purchase.partnerFk);

        const purchFormDate = helper.toMySQLDate(purchase.formDate);
        const purchDueDate = helper.toMySQLDate(purchase.dueDate);
        const purchPaidDate = helper.toMySQLDate(purchase.paidDate);

        purchSqlValues += `\n(${purchase.id}, ${purchase.type}, ${purchase.branchFk}, '${purchase.formNo}', ${purchFormDate}, ${purchase.partnerFk}, NULL, NULL, NULL, ${purchDueDate}, ${purchPaidDate}, 0, 0, 0, NULL, NULL, 0, 0, NULL, NULL, 0, NULL),`;
    });

    purchSqlStr = helper.isEmpty(purchSqlValues) ? '' : (purchSql + purchSqlValues.slice(0, -1) + ';');

    // sort in javascript by default is alphabetically, user sort( (a, b) => a - b) to sort numerically from smaller to bigger and sort( (a, b) => b - a) for bigger to smaller
    const suppIdsArr = Array.from(supplierIdsSet).sort((x, y) => x - y);

    return [purchSqlStr, purchIdsArr, suppIdsArr];
};


/**
 * Preparing to add new suppliers not yet been added
 */
const prepSupplier = async (suppIdsArr) => {
    let suppSqlValues = '';

    const [newSuppliers, newSuppIdsArr] = await getNewSuppliers(suppIdsArr);
    
    newSuppliers.forEach((supplier) => {
        suppSqlValues += `\n(${supplier.id}, '${supplier.code}', '${supplier.name}', '${supplier.address}', '${supplier.phone}', '${supplier.description}', '${supplier.taxFileNumber}', ${supplier.status}),`;
    });

    return [(helper.isEmpty(suppSqlValues) ? '' : (suppSql + suppSqlValues.slice(0, -1) + ';')), newSuppIdsArr];
};


/**
 * Preparing to get purchase detail ids and item ids in addition to prepare the purchased detail sql statement.
 */
const prepPurcaseDetail = async (purchIdsArr) => {
    let purchDetailIdsArr = [];
    let itemIdsSet = new Set();
    let purchDetailSqlStr = '', purchDetailSqlValues = '';

    // Prepare transfer purchases
    (await getPurchaseDetails(purchIdsArr)).forEach((detail) => {
        purchDetailIdsArr.push(detail.id);
        itemIdsSet.add(detail.itemFk);

        const expiredDate = helper.toMySQLDate(detail.expiredDate);

        purchDetailSqlValues += `\n(${detail.id}, ${detail.headerFk}, ${detail.itemFk}, ${detail.type}, ${detail.quantity}, '${detail.unit}', ${detail.unitPrice / 1.1}, ${detail.discount}, 0, '${detail.discountText}', ${expiredDate}, '', NULL, NULL, NULL, NULL),`;
    });

    purchDetailSqlStr = helper.isEmpty(purchDetailSqlValues) ? '' : (purchDetailSql + purchDetailSqlValues.slice(0, -1) + ';');

    // sort in javascript by default is alphabetically, user sort( (a, b) => a - b) to sort numerically from smaller to bigger and sort( (a, b) => b - a) for bigger to smaller
    const itemIdsArr = Array.from(itemIdsSet).sort((x, y) => x - y);

    return [purchDetailSqlStr, purchDetailIdsArr, itemIdsArr];
};


/**
 * Preparing to add new items not yet been added
 */
const prepItem = async (itemIdsArr) => {
    let itemSqlValues = '';

    const [newItems, newItemIdsArr] = await getNewItems(itemIdsArr);
    
    newItems.forEach((item) => {
        itemSqlValues += `\n(${item.id}, '${item.code}', '${item.name}', '${item.unit}', ${item.weight}, ${item.purchasePrice}, ${item.salesPrice}, 0, 0, ${item.categoryFk}, '', ${item.status}),`;
    });

    return [(helper.isEmpty(itemSqlValues) ? '' : (itemSql + itemSqlValues.slice(0, -1) + ';')), newItemIdsArr];
};
