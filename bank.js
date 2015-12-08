var Bank = require('banking');
var moment = require('moment');
var Promise = require('promise');
var entities  = new (require('html-entities').AllHtmlEntities)();

module.exports = {

    /********************
     * Private Instances
     *******************/

    _bank: null,

    _buildStatement: function (data) {
        data = data.body;
        var root = data.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS;

        if (!root) return null; // We couldn't connect //

        var result = {
            balance: root.AVAILBAL.BALAMT,
            accountName: root.BANKACCTFROM.ACCTTYPE,
            accountId: root.BANKACCTFROM.ACCTID,
            transactions: []
        };

        for (var entryKey in root.BANKTRANLIST.STMTTRN) {
            var entry = root.BANKTRANLIST.STMTTRN[entryKey];
            result.transactions.push({
                memo: entities.decode(entry.MEMO),
                amount: entry.TRNAMT,
                dateAvailable: moment(entry.DTAVAIL, "YYYYMMDDHHmmss"),
                datePosted: moment(entry.DTPOSTED, "YYYYMMDDHHmmss")
            });
        }

        return result;
    },

    /********************
     * Public Instances
     *******************/
    prepare: function(account) {
        this._bank = Bank(account);
    },

    getTransactions: function(dateFrom, dateTo) {
        return new Promise(function(fulfill, reject) {
            dateFrom = dateFrom || moment().subtract(30, 'days');
            dateTo = dateTo || moment();

            this._bank.getStatement({
                start: dateFrom.format("YYYYMMDD"),
                end: dateTo.format("YYYYMMDD")
            }, function(err, result) {
                if (err) reject(result);
                else {
                    var parse = this._buildStatement(result);
                    if (!parse) {
                        reject("Invalid Credentials Supplied");
                        return;
                    }
                    fulfill(parse);
                }
            }.bind(this));
        }.bind(this));
    }
};