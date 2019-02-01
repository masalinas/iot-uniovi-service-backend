'use strict';

var moment = require('moment');

const DEF_KEY = 'FREQUENCY'; // Frequency Key code
var frequency;  // current frequency in minutes

var historizes = [];

module.exports = function(Measure) {    
    Measure.getFrequencyByKey = function() {
        return DEF_KEY;
    }

    Measure.setFrequency = function(value, cb) {
        if (frequency < 0)
            return cb(new Error('The frequency must be positive'));

        frequency = value;

        return cb(null, frequency);
    }

    function saveMeasure(measure, cb) {        
        // check if exist any historize for the measure
        var historize = historizes.find(historize => historize.measure.device === measure.device);

        if (historize == undefined) { // persist the measure and historize                       
            Measure.upsert(measure, function (err, result) {
                if (err) return cb(err);

                // measure persisted
                var measure = result.__data;

                // create a new historize for the measure persisted
                historizes.push({measure: measure, measures: []});

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

                    cb(null, measure);
                });
            }
        }
    }

    Measure.historize= function(measure, cb) {   
        // get historize frequency (only at service start up)    
        if (frequency == undefined) {                
            var configuration = Measure.app.models.Configuration;

            configuration.getByKey(DEF_KEY , function (err, result) {
                if (err) throw err;
        
                // get configuration result
                var configuration = result;

                // get historize frequency
                frequency = configuration.value;

                saveMeasure(measure, cb);
            });
        }
        else
            saveMeasure(measure, cb);                               
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
