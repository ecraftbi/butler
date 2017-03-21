var globals = require('../globals');

var dns = require('dns');
//var chalk  = require('chalk');



module.exports.respondDNSResolveSRV = function (req, res, next) {
    dns.resolveSrv(req.params.hostname, function(err, rec) {
        if (err) {
            //console.error(chalk.red('* dns.resolveSrv(\'%s\'): err: %j'), req.params.hostname, err);
            console.error('dnsResolveSrv(\'%s\'): err: %j', req.params.hostname, err);
        }
        else {
            console.info('dnsResolveSrv(\'%s\'): rec: %j', req.params.hostname, rec);
        }

        res.send(rec);
        next();
    });

}
