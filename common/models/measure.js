'use strict';

var moment = require('moment');

const DEF_KEY = 'FRECUENCY'; // Frecuency Key code
var frec;  // current frecuency in minutes

var historized; //last meaure historized
var measures = []; // historize array measures

module.exports = function(Measure) {
    Measure.updateFrecuency = function(frecuency) {
        if (frecuency < 0)
            return cb(new Error('The frecuency must be positive'));

        frec = frecuency;        
    }

    Measure.getKeyFrecuency = function() {
        return DEF_KEY;
    }

    Measure.setFrecuency = function(frecuency, cb) {
        if (frecuency < 0)
            return cb(new Error('The frecuency must be positive'));

        frec = frecuency;

        return cb(null, frec);
    }

    function findLastMeasure(measure, cb) {
        if (historized == null || historized == undefined) {
            Measure.findOne({where: {device: measure.device}, order: 'date DESC'}, function (err, result) {
                if (err) return cb(err);

                // if not exist any data in the database
                if (result == null)
                    saveMeasure(measure, cb);
                else {    
                    historized = result.__data;

                    saveMeasure(measure, cb);
                }
            });
        } else
            saveMeasure(measure, cb);
    }

    function saveMeasure(measure, cb) {
        // check if exist any data in the database
        if (historized == null || historized == undefined) {
            // persist the measure
            Measure.upsert(measure, function (err, result) {
                if (err) return cb(err);

                historized = result.__data;

                cb(null, historized);
            });
        }
        else {            
            var diff = moment(new Date()).diff(moment(historized.date), 'seconds');

            if (diff < frec * 60) {
                // insert data in the historize array
                measures.push(measure);

                // not persist any data
                cb(null, null);
            }
            else {
                // calculate measure average
                var avg;
                if (measures.length == 0)
                    avg = measure.value;
                else {                    
                    var sum = 0;
                    for( var i = 0; i < measures.length; i++ ) {
                        if ( measures[i].device == measure.device)
                            sum += measures[i].value;
                    }

                    avg = sum/measures.length;
                }

                var avgMeasure = {date: new Date(), value: avg, device: measure.device};

                // persist the measure average
                Measure.upsert(avgMeasure, function (err, result) {
                    if (err) return cb(err);
            
                    // update last historized measure
                    historized = result.__data;

                    cb(null, historized);
                });
            }
        }
    }

    Measure.historize= function(measure, cb) {        
        if (frec == undefined) {
            var configuration = Measure.app.models.Configuration;

            configuration.getByKey(DEF_KEY , function (err, result) {
                if (err) throw err;
        
                frec = result;

                findLastMeasure(measure, cb);
            });
        }
        else
            findLastMeasure(measure, cb);                               
    }    

    Measure.remoteMethod (
        'setFrecuency',
        {
            description : "Set measure frecuency",
            accepts: [{arg: 'frecuency', type: 'number',  description: 'Historize Frecuency', required: true, http: {source: 'path'}}],
            returns: {type: 'object', root: true},
            http: {verb: 'post', path: '/measures/:frecuency/frecuency'}
        }
    );
    
    Measure.remoteMethod (
        'historize',
        {
            description : "Historize Measure",
            accepts: [{arg: 'measure', type: 'object',  description: 'Measure', required: true, http: {source: 'body'}}],
            returns: {type: 'object', root: true},
            http: {verb: 'post', path: '/measures/historize'}
        }
    );
};
