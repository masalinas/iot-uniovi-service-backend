'use strict';

module.exports = function(Configuration) {
  Configuration.getByKey= function(key, cb) {    
    Configuration.findOne({where: {key: key}}, function (err, result) {
      if (err) return cb(err);

      var configuration = result.__data;

      return cb(null, configuration.value);
    });
  };

  Configuration.updateKey= function(key, value, cb) {    
    Configuration.findOne({where: {key: key}}, function (err, result) {
      if (err) return cb(err);

      var configuration = result.__data;
      configuration.value = value;

      Configuration.upsert(configuration, function (err, result) {
        if (err) return cb(err);

        // update measure configuration
        var measure = Configuration.app.models.Measure;
        if (key == measure.getKeyFrecuency())
          measure.updateFrecuency(value);

        cb(null, result.__data);
      });
    });
  };

  Configuration.remoteMethod (
    'getByKey',
    {
        description : "Get configuration by key",
        accepts: [{arg: 'key', type: 'string',  description: 'Key code', required: true, http: {source: 'path'}}],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/configurations/:key/getByKey'}
    }
  );

  Configuration.remoteMethod (
    'updateKey',
    {
        description : "Set configuration by key value",
        accepts: [{arg: 'key', type: 'string',  description: 'Key code', required: true, http: {source: 'path'}},
                  {arg: 'value', type: 'any',  description: 'Key value', required: true, http: {source: 'path'}}      ],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/configurations/:key/:value/updateKey'}
    }
  );
}
