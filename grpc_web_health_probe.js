#!/usr/bin/env node
'use strict'

const {HealthCheckRequest, HealthCheckResponse} = require('./health_pb.js');
const {HealthClient} = require('./health_grpc_web_pb.js');
const opts = require('commander')

opts
  .usage('--addr address of grpc web servers')
  .option('-d, --addr <address>', 'address of grpc web server(e.g. http://localhost:50051)', String)
  .parse(process.argv);

// grpc-web uses XMLHttpRequest, but it does not exist in cli.
global.XMLHttpRequest = require('xhr2');

function toString(status) {
    for (let key in HealthCheckResponse.ServingStatus) {
        if (HealthCheckResponse.ServingStatus[key] === status) {
            return key;
        } 
    }
    return "UNKNOWN";
};

async function main() {
    var healthClient = new HealthClient(opts.addr);
    let request = new HealthCheckRequest();

    await new Promise((resolve, reject) => {
        healthClient.check(request, {}, function(err, response) {
            if (!err) {
                console.log('status: ' + toString(response.getStatus()));
            } else {
                console.log(`Unexpected error for check: code = ${err.code}` + `, message = "${err.message}"`);
            }
            resolve();
        });
    });
}
main();
