import db from './db.js'

db.then(database => {
  const tables = database.exec('SELECT * FROM cb_degrees');
  console.log(tables);
});