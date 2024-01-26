const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
  console.error('verify-json: no file specified');
  process.exit(1);
}

let data;
try {
  data = fs.readFileSync(filePath);
} catch (e) {
  console.error('verify-json: failed to read file');
  process.exit(1);
}

if (!data) {
  console.error('verify-json: file is empty');
  process.exit(1);
}

try {
  JSON.parse(data);
} catch (e) {
  console.error('verify-json: not valid json', e.message);
  process.exit(1);
}

//success
process.exit(0);
