import pino from 'pino';

import config from '../config';

const log = pino({
  name: 'SignAssist',
  level: config.logLevel,
  browser: {
    asObject: true,
  },
}).child({ name: 'SignAssist' });

export default log;
