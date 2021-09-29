#!/usr/bin/env node
'use strict'

const { HealthCheckRequest, HealthCheckResponse } = require('./health_pb.js');
const { HealthPromiseClient } = require('./health_grpc_web_pb.js');
const opts = require('commander')

opts
    .usage('--addr address of grpc web servers')
    .option('-d, --addr <address>', 'address of grpc web server(e.g. http://localhost:50051)', String)
    .usage('--timeout the time in seconds before the request is automatically terminated')
    .option('-t, --timeout <timeout>', 'the time in seconds before the request is automatically terminated', Number, 1)
    .parse(process.argv);

// StatusInvalidArguments indicates specified invalid arguments.
const StatusInvalidArguments = 1;
// StatusConnectionFailure indicates connection failed.
const StatusConnectionFailure = 2;
// StatusRPCFailure indicates rpc failed.
const StatusRPCFailure = 3;
// StatusUnhealthy indicates rpc succeeded but indicates unhealthy service.
const StatusUnhealthy = 4;

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
    var timeout = new Date();
    timeout.setSeconds(timeout.getSeconds() + opts.timeout);

    await healthClient.check(request, {deadline: timeout.getTime()})
        .then(response => {
            let status = toString(response.getStatus());
            console.log('status: ' + status);

            if (status !== "SERVING") {
                process.exitCode = StatusUnhealthy;
            }
        })
        .catch(err => {
            console.log(`Unexpected error for check: code = ${err.code}` + `, message = "${err.message}"`);
            process.exitCode = StatusRPCFailure;
        });
})();
