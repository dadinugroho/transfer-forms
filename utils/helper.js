module.exports.isEmpty = ( (str) => {
    return (!str || 0 === str.toString().trim().length);
});

module.exports.toMySQLDate = ( (theDate) => {
    return (this.isEmpty(theDate) ? 'NULL' : `'${theDate.toISOString().slice(0, 10)}'`);
});
