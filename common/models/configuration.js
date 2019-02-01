'use strict';

module.exports = function(Configuration) {
  Configuration.getByKey= function(key, cb) {    
    Configuration.findOne({where: {key: key}}, function (err, result) {
      if (err) return cb(err);

      // get configuration result
      if (result == null)
        return cb(new Error('The configuration not exist'), null);

      var configuration = result.__data;

      return cb(null, configuration);
    });
  };

  Configuration.updateKey= function(key, value, cb) {    
    Configuration.getByKey(key, function (err, result) {
      if (err) return cb(err);

      // get configuration result
      var configuration = result;

      // set historize frequency
      configuration.value = value;

      // persist historize frequency value
      Configuration.upsert(configuration, function (err, result) {
        if (err) return cb(err);

        configuration = result.__data;

        // propagate historize frequency to Measure service
        var measure = Configuration.app.models.Measure;
        if (key == measure.getFrequencyByKey()) {
          measure.setFrequency(value,  function (err, result) {
            if (err) return cb(err);

            cb(null, configuration);    
          });
        } else
          cb(null, configuration);
      });
    });
  };

  Configuration.remoteMethod (
    'getByKey',
    {
        description : "Get configuration by key",
        accepts: [{arg: 'key', type: 'string',  description: 'Key code', required: true, http: {source: 'path'}}],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/:key/getByKey'}
    }
  );

  Configuration.remoteMethod (
    'updateKey',
    {
        description : "Set value configuration by key",
        accepts: [{arg: 'key', type: 'string',  description: 'Key code', required: true, http: {source: 'path'}},
                  {arg: 'value', type: 'any',  description: 'Key value', required: true, http: {source: 'path'}}      ],
        returns: {type: 'object', root: true},
        http: {verb: 'post', path: '/:key/:value/updateKey'}
    }
  );
}
