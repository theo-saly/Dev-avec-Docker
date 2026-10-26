import inmemoryRepo from './inmemory';
import mysqlRepo from './mysql';

const repository = process.env.NODE_ENV === 'test' ? inmemoryRepo : mysqlRepo;

export default repository;
