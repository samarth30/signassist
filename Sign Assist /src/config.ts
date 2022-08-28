interface Config {
  dev: boolean;
  server: string;
  logLevel: string;
}

const config: Config = { dev: true, server: '', logLevel: 'debug' };

// Changable Configurations //

const dev = true;

// Set of constants //

// const DEV_SERVER = 'http://localhost:3001/tenderlyFork';
// nftapprovallooksrare
// const DEV_SERVER = 'http://localhost:3001/transactionDataRead/usdctoeth';

const DEV_SERVER = 'http://localhost:3001/transactionDataRead/data';
const PROD_SERVER =
  'https://signassistsimulationapi.herokuapp.com/tenderlyFork';

config.dev = dev;

if (dev) {
  config.logLevel = 'warn';
  config.server = DEV_SERVER;
} else {
  config.logLevel = 'warn';
  config.server = PROD_SERVER;
}

export default config;
