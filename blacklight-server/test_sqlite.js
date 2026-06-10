const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec("CREATE TABLE t (x TEXT)");
db.prepare("INSERT INTO t VALUES (?)").run("hello");
const row = db.prepare("SELECT * FROM t").get();
console.log("Node SQLite OK:", row.x);
