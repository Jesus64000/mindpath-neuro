const db = require('./backend/config/db');
async function d() {
  const [app] = await db.query('DESCRIBE appointments');
  console.log("Appointments Columns:");
  app.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
  const [doc] = await db.query('DESCRIBE doctors');
  console.log("Doctors Columns:");
  doc.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
  process.exit(0);
}
d().catch(console.error);
