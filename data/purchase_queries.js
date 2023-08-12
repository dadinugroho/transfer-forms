import { knex1, knex2 } from '../utils/db';

const PURCHASE = 2;
const TAXABLE = 1;

export async function getPurchases(periode) {
    try {
        return await knex1('form_header')
                        .select()
                        .where('type', PURCHASE)
                        .andWhere('taxable', TAXABLE)
                        .andWhere('formDate', 'like', periode);
                        // .andWhere('formDate', '>=', '2020-08-18')
                        // .andWhere('formDate', '<=', '2020-08-31');
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    } 
}

export async function getExistingPurchases(purchIdsArr) {
    try {
        return await knex2('form_header')
                        .select('id')
                        .whereIn('id', purchIdsArr);
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    } 
}

export async function getNewSuppliers(supplierIdsArr) {
    try {
        let existingSupplierIdsArr = [];

        (await knex2('supplier').select().whereIn('id', supplierIdsArr)).forEach( (supplier) => {
            existingSupplierIdsArr.push(supplier.id);
        });

        const newSupplierIdsArr = supplierIdsArr.filter(item => !existingSupplierIdsArr.includes(item));

        return await knex1('supplier').select().whereIn('id', newSupplierIdsArr);
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    } 
}

export async function getPurchaseDetails(purchaseIdsArr) {
    try {
        return (await knex1('form_detail').select().whereIn('headerFk', purchaseIdsArr));
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    } 
}

export async function getNewItems(itemIdsArr) {
    try {
        let existingItemIdsArr = [];

        (await knex2('item').select().whereIn('id', itemIdsArr)).forEach( (item) => {
            existingItemIdsArr.push(item.id);
        });

        const newItemIdsArr = itemIdsArr.filter(item => !existingItemIdsArr.includes(item));

        return await knex1('item').select().whereIn('id', newItemIdsArr);
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    } 
}
