module.exports = {
  'uniovidb': {
    'host': process.env.MONGODB_URL || 'localhost',
    'port': process.env.MONGODB_PORT || 27017,
    // 'url' : 'mongodb://uniovi:thingtrack@localhost:27017/uniovidb',
    'database': process.env.MONGODB_DB || 'uniovidb',
    'password': process.env.MONGODB_PASSWORD || 'thingtrack',
    'name': 'uniovidb',
    'user': process.env.MONGODB_USER || 'uniovi',
    'connector': 'mongodb',
  },
};
