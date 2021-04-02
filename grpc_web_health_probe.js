#!/usr/bin/env node
'use strict'

const { HealthCheckRequest, HealthCheckResponse } = require('./health_pb.js');
const { HealthPromiseClient } = require('./health_grpc_web_pb.js');
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

(async() => {
    var healthClient = new HealthPromiseClient(opts.addr);
    let request = new HealthCheckRequest();

    await healthClient.check(request, {})
        .then(response => {
            console.log('status: ' + toString(response.getStatus()));
        })
        .catch(err => {
            console.log(`Unexpected error for check: code = ${err.code}` + `, message = "${err.message}"`);
        });
})();
