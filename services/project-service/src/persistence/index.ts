import inmemoryRepo from './inmemory';
import sqliteRepo from './sqlite';
import mysqlRepo from './mysql';

let repository;
if (process.env.NODE_ENV === 'test') repository = inmemoryRepo;
else if (process.env.DB_TYPE === 'mysql') repository = mysqlRepo;
else repository = sqliteRepo;

export default repository;
