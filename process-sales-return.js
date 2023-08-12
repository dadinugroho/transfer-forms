const { knex1, knex2 } = require('./utils/db');

const INV_ACCFK = 2;

const returnDetails = {
    '21031611303161': '21031514263886',
    '21033011062291': '21032611260886',
}

const main = async () => {
    Object.keys(returnDetails).forEach(async key => {
        let value = returnDetails[key];

        let returnRefRow = getReturnRefRow(key);
        let journalRow = getJournalRow(key, value);

        Promise.all([returnRefRow, journalRow])
            .then(values => {    // `users` is an array of users, in the same order as the IDs
                console.log(values);
                console.log('here');
            })
            .catch(error => {
              console.log(error);
            });
    });

    const rows = await knex1('form_detail')
                    .where('id', '21031611303161')
                    .select()
                    .first();
    
    // console.table(rows);

    process.exit(0);
};

const getReturnRefRow = key => {
    knex1('form_detail')
        .where('id', key)
        .select()
        .first().then(row => {
            console.log('A')
            console.log(row)
            return Promise.resolve( row );
        });
}

const getJournalRow = (referenceFk, detailFk) => {
    knex1('journal')
        .where('referenceFk', referenceFk)
        .andWhere('detailFk', detailFk)
        .select()
        .first().then(row => {
            console.log('B')
            console.log(row)
            return Promise.resolve( row );
        })
}

// Run the app
main();
