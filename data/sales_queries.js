import { knex1, knex2 } from '../utils/db';

const PURCHASE = 2;
const INVENTORY = 2;

export async function getPurchaseReferences(periode) {
    try {
        const purchase = await knex2('form_header')
            .select('id')
            .where('type', PURCHASE)
            .andWhere('formDate', 'like', periode)
            .andWhere('status', 2);

        return (await knex2('form_detail')
            .select()
            .whereIn('headerFk', purchase.map(({ id }) => id))
        );
    } catch (err) {
        knex1.destroy();
        knex2.destroy();
    }
}

export async function getTransactions(referenceIdsArr) {
    try {
        // partnerFk = (4, 5, 6, 7, 18, 21, 26, 226) is considered as Penjualan Toko 1001

        return (await knex1({ j: 'journal' })
            .select({ ID: 'j.detailFk' }, { HeaderFk: 'j.headerFk' }, { TipeForm: 'h.type' }, { NoForm: 'h.formNo' }, { Tgl: 'h.formDate' }, { PartnerFk: 'h.partnerFk' },
                { ItemFk: 'j.itemFk' }, { Barang: 'i.name' }, { Sat: 'd.unit' },
                { Tipe: 'j.type' }, { Qty: 'd.quantity' }, { HrgSat: 'd.unitPrice' }, { Diskon: 'd.discount' },
            )
            .select(knex1.raw('(CASE WHEN (h.type IN (3, 6) AND h.partnerFk IN (4, 5, 6, 7, 18, 21, 26, 226)) THEN "1001" WHEN h.type IN (3, 6) THEN (h.partnerFk + 1000) WHEN h.type IN (4, 7) THEN (h.partnerFk + 2000) ELSE h.partnerFk END) as CustomerFk'))
            .select(knex1.raw('(d.quantity * (d.unitPrice - d.discount)) as Subtotal'))
            .select({ ReferenceFk: 'j.referenceFk' }, { ItemRef: 'j.itemRefFk' }, { Modal: 'r.unitPrice' }, { ModalDiskon: 'r.discount' })
            .select(knex1.raw('(d.quantity * (r.unitPrice - r.discount)) as CoG'))
            .leftJoin({ h: 'form_header' }, 'h.id', 'j.headerFk')
            .leftJoin({ d: 'form_detail' }, 'd.id', 'j.detailFk')
            .leftJoin({ r: 'form_detail' }, 'r.id', 'j.referenceFk')
            .leftJoin({ i: 'item' }, 'i.id', 'j.itemFk')
            .where('j.accountFk', INVENTORY)
            .whereIn('j.referenceFk', referenceIdsArr)
            // .andWhere('j.journalDate', 'like', '2020-08-%')
            .orderByRaw('j.journalDate ASC, j.headerFk ASC')
        );
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    }
}

export async function getCustomer(custNewId, custOldId) {
    try {
        let partner = null;

        if (null != custNewId && 1000 < custNewId) {
            //     const exCust = await knex2('customer')
            //         .select('id')
            //         .where('id', custNewId);

            //         console.log(await knex2('customer').max('code as max_code').toSQL());
            //     if (!exCust) {
            //         const lastCust = await knex2('customer').max('code as max_code');
            //         console.log(lastCust);
            //         console.log(await knex2('customer').max('code as max_code').toSQL());
            //     }
            //     //console.log(custNewId + ' - ' + custOldId);
            //     // if (!(await knex2('customer').where('id', custNewId))) {
            //     // const lastestCode = await knex2('customer').max('code as maxCode');
            //     // console.log(knex2('customer').where('id', custNewId).select('id').first());
            //     const nextCode = +lastestCode.maxCode.toString().substring(2) + 1;
            //     const newCode = 'C-' + nextCode.toString().padStart(5, '0');

                if (2000 < custNewId) {
                    partner = { id: custNewId, code: custOldId, name: 'A' };
                    // let cust = await knex1('customer').select().where('id', custOldId).first();
                    // partner = { id: custNewId, code: 'A', name: cust.name };
                } else {
                    partner = { id: custNewId, code: custOldId, name: 'B' };
                    // let branch = await knex1('branch').select().where('id', custOldId).first();
                    // partner = { id: custNewId, code: 'B', name: branch.name };
                }
            //     // }
        }

        return partner;
    } catch (err) {
        console.log(err);
        knex1.destroy();
        knex2.destroy();
    }
}


export async function checkDupSales(salesId) {
    let sales = null;

    if (await knex1('form_header').where('id', salesId)) {
        sales = salesId;
    }

    return sales;
}


export async function checkDupSalesDetail(salesDetailId) {
    let detail = null;

    if (await knex2('form_detail').where('id', salesDetailId)) {
        detail = salesDetailId;
    }

    return detail;
}

export async function getOldSales(newSalesIdsArr) {
    const sales = await knex2('form_header')
        .select('id')
        .whereIn('id', newSalesIdsArr)

    return sales.map(({ id }) => id);
}

export async function getOldSalesDetail(newDetailIdsArr) {
    const sales = await knex2('form_detail')
        .select('id')
        .whereIn('id', newDetailIdsArr)

    return sales.map(({ id }) => id);
}
