'use strict';

var redis = require("redis");
var moment = require('moment');
var app = require('../../server/server');

var clusterize = app.get('clusterize');
var sub = redis.createClient(), pub = redis.createClient(), client = redis.createClient();

const DEF_KEY_FREQUENCY = 'FREQUENCY'; // Frequency topic
const DEF_KEY_HISTORIZE = 'HISTORIZE'; // Historize topic

var frequency;  // current persistence frequency in minutes
var historizes = [];

// define pub/sub channels for frequency topic in redis if API is clusterized
if (clusterize == true) {
    sub.on("error", function (err) {
        console.log("Redis sub error " + err);
    });

    sub.on('connect', function() {
        console.log('Redis sub connected');        
    });

    pub.on("error", function (err) {
        console.log("Redis pub error " + err);
    });

    pub.on('connect', function() {
        console.log('Redis pub connected');
    });

    client.on("error", function (err) {
        console.log("Redis client error " + err);
    });

    client.on('connect', function() {
        console.log('Redis client connected from PID: ' + process.pid);
    });

    sub.on("subscribe", function (channel, count) {
        console.log("subscribed to channel: " + channel + ", count: " + count + ' from PID: ' + process.pid);    
    });
    
    sub.on("message", function (channel, message) {
        if (channel == DEF_KEY_FREQUENCY)
            frequency = message;    
    });

    sub.subscribe(DEF_KEY_FREQUENCY);
}

module.exports = function(Measure) {    
    Measure.getFrequencyByKey = function() {
        return DEF_KEY_FREQUENCY;
    }

    Measure.setFrequency = function(value, cb) {
        if (frequency < 0)
            return cb(new Error('The frequency must be positive ' + ' from PID: ' + process.pid));

        frequency = value;
        
        // republish frequency value to all api instances if API is clusterized
        if (clusterize == true)
            pub.publish(DEF_KEY_FREQUENCY, frequency);

        return cb(null, frequency);
    }
    
    function saveMeasure(measure, cb) {        
        var historize = historizes.find(historize => historize.measure.device === measure.device);

        if (historize == undefined) { // persist the measure and historize                       
            Measure.upsert(measure, function (err, result) {
                if (err) return cb(err);

                // measure persisted
                var measure = result.__data;

                // create a new historize for the measure persisted
                historizes.push({measure: measure, measures: []});

                // set historize in redis server
                if (clusterize == true) {
                    client.set(DEF_KEY_HISTORIZE, JSON.stringify(historizes));

                    console.log('Set redis historized key from PID: ' + process.pid);
                }

                cb(null, measure);
            });
        }
        else { 
            // check the persistence frequency
            var diff = moment(new Date()).diff(moment(historize.measure.date), 'seconds');

            // frequency in minutes
            if (diff < frequency * 60) {
                // insert data in the historize measures collection
                historize.measures.push(measure);

                // set historize in redis server
                if (clusterize == true) {
                    client.set(DEF_KEY_HISTORIZE, JSON.stringify(historizes));

                    console.log('Set redis historized key from PID: ' + process.pid);
                }

                cb(null, measure);
            }
            else {
                var avg;

                // calculate measure average from historize collection
                if (historize.measures.length == 0)
                    avg = measure.value;
                else {                    
                    var sum = 0;
                    for( var i = 0; i < historize.measures.length; i++ ) {
                        if ( historize.measures[i].device == measure.device)
                            sum += historize.measures[i].value;
                    }

                    avg = sum/historize.measures.length;
                }

                var avgMeasure = {date: new Date(), value: avg, device: measure.device};

                // persist the measure average
                Measure.upsert(avgMeasure, function (err, result) {
                    if (err) return cb(err);
            
                    // measure persisted
                    var measure = result.__data;

                    // update historized from last measure persisted and clear measures collection
                    historize.measure = measure;
                    historize.measures = [];

                    // set historize in redis server
                    if (clusterize == true) {
                        client.set(DEF_KEY_HISTORIZE, JSON.stringify(historizes));

                        console.log('Set redis historized key from PID: ' + process.pid);
                    }

                    cb(null, measure);
                });
            }
        }
    }

    function getHistorizes(measure, cb) {
        client.get(DEF_KEY_HISTORIZE, function (err, result) {
            if (err) {
                console.log(err);
                throw err;
            }

            console.log('Get redis historized key from PID: ' + process.pid);

            if (result == null)
                historizes = [];            
            else
                historizes = JSON.parse(result);

            saveMeasure(measure, cb);
        });
    }

    Measure.historize= function(measure, cb) {   
        // get historize frequency (only at service start up)    
        if (frequency == undefined) {                
            var configuration = Measure.app.models.Configuration;

            configuration.getByKey(DEF_KEY_FREQUENCY , function (err, result) {
                if (err) throw err;
        
                // get configuration result
                var configuration = result;

                // get historize frequency
                frequency = configuration.value;

                getHistorizes(measure, cb);
            });
        }
        else
            getHistorizes(measure, cb);                               
    }    

    Measure.remoteMethod (
        'setFrequency',
        {
            description : "Set measure frequency",
            accepts: [{arg: 'frequency', type: 'number',  description: 'Historize frequency', required: true, http: {source: 'path'}}],
            returns: {type: 'object', root: true},
            http: {verb: 'post', path: '/:frequency/setFrequency'}
        }
    );
    
    Measure.remoteMethod (
        'historize',
        {
            description : "Historize Measure",
            accepts: [{arg: 'measure', type: 'object',  description: 'Measure', required: true, http: {source: 'body'}}],
            returns: {type: 'object', root: true},
            http: {verb: 'post', path: '/historize'}
        }
    );
};
