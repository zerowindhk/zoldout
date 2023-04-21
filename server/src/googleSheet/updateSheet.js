const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('node:path');
const dotenv = require('dotenv');
const fs = require("fs");
const { parse } = require("csv-parse");

var envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

const auth = async (doc) => {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo(); // loads document properties and worksheets
  console.log('doc is ready', doc.title);
};

const updateMaterialDrop = async () => {
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells(`B2:D${sheet.rowCount}`);
  //update EngLish Name
  fs.createReadStream("../../csv/lz_card_CardBook.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    console.log(row);
  })
  .on("end", function () {
    console.log("finished");
  })
  .on("error", function (error) {
    console.log(error.message);
  });
  //update Japanese Name
};

auth(doc).then(() => {
  updateMaterialDrop();

})