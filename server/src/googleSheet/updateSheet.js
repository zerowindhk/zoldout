const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('node:path');
const dotenv = require('dotenv');
const fs = require('fs');
const parse = require('csv-parser');

var envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
// console.log(doc);
const auth = async (doc) => {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo(); // loads document properties and worksheets
  console.log('doc is ready', doc.title);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const trimName = (name) => {
  return name
    ? name
        .replace('《', '')
        .replace('》', '')
        .replace('『', '')
        .replace('』', '')
    : name;
};

const findWeapon = async (sheet, name, replaceName, lang) => {
  const langIndex = lang === 'en' ? 1 : lang === 'jp' ? 2 : 0;
  if (name !== replaceName) {
    for (let i = 1; i < sheet.rowCount; i++) {
      const cell = sheet.getCell(i, langIndex);
      const cellValue = trimName(cell.value);
      if (cellValue === name) {
        cell.value = replaceName;
        console.log(
          i,
          lang,
          'cellValue',
          cellValue,
          'chiName',
          name,
          'replaceName',
          replaceName
        );
        await sheet.saveUpdatedCells();
        await sleep(1250);
      }
    }
  }
};

const findMaterial = async (sheet, name, replaceName, lang) => {
  const langIndex = lang === 'en' ? 4 : lang === 'jp' ? 5 : 3;
  if (name !== replaceName) {
    for (let i = 1; i < sheet.rowCount; i++) {
      let hasChanges = false;
      const cell = sheet.getCell(i, langIndex);
      // console.log(i,lang,cell)
      const cellValues = cell.value.split('/');
      const newValues = [];
      cellValues.forEach((cellValue) => {
        if (cellValue === name) {
          hasChanges = true;
          newValues.push(replaceName);
        } else {
          newValues.push(cellValue);
        }
      });
      if (hasChanges) {
        console.log(i, lang, cell.value, newValues.join('/'));
        cell.value = newValues.join('/');
        await sheet.saveUpdatedCells();
        await sleep(1250);
      }
    }
  }
};

const findWeaponInMaterial = async (sheet, name, replaceName, lang) => {
  const langIndex = lang === 'en' ? 5 : lang === 'jp' ? 6 : 4;
  if (name !== replaceName) {
    for (let i = 1; i < sheet.rowCount; i++) {
      let hasChanges = false;
      const cell = sheet.getCell(i, langIndex);
      // console.log(i, lang, cell.value);
      const cellValues = cell.value.split('/');
      const newValues = [];
      cellValues.forEach((cellValue) => {
        // console.log(name);
        if (trimName(cellValue) === name) {
          hasChanges = true;
          newValues.push(replaceName);
        } else {
          newValues.push(cellValue);
        }
      });
      if (hasChanges) {
        console.log(i, lang, cell.value, newValues.join('/'));
        cell.value = newValues.join('/');
        await sheet.saveUpdatedCells();
        await sleep(1250);
      }
    }
  }
};

const findDropInMaterial = async (sheet, name, replaceName, lang) => {
  const langIndex = lang === 'en' ? 2 : lang === 'jp' ? 3 : 1;
  const exactRe = new RegExp(`^[0-9]+${name}$`);
  if (name !== replaceName) {
    for (let i = 1; i < sheet.rowCount; i++) {
      let hasChanges = false;
      const cell = sheet.getCell(i, langIndex);
      // console.log(i, lang, cell.value, cell.textFormat);
      const cellValues = cell.value.split('/');
      const newValues = [];
      cellValues.forEach((cellValue) => {
        if (exactRe.test(cellValue)) {
          hasChanges = true;
          const re2 = /\d+/;
          const number = cellValue.match(re2);
          if (number) {
            const count = parseInt(number[0]);
            newValues.push(count + replaceName);
          }
        } else {
          newValues.push(cellValue);
        }
      });
      if (hasChanges) {
        console.log(i, lang, cell.value, newValues.join('/'));
        cell.value = newValues.join('/');
        await sheet.saveUpdatedCells();
        await sleep(1250);
      }
    }
  }
};

const readCSV = async (fileName) => {
  const result = [];
  const rs = fs
    .createReadStream(path.resolve(__dirname, fileName))
    .pipe(parse({ delimiter: ',', from_line: 2 }));
  for await (const line of rs) {
    // console.log(line);
    result.push(line);
  }
  // console.log('readCSV', result)
  return result;
};

const updateWeapon = async () => {
  const sheet = doc.sheetsByIndex[1];
  await sheet.loadCells(`A1:C${sheet.rowCount}`);
  const weaponList = [];
  console.log('Sword');
  let weapon = await readCSV('../../csv/lz_card_CardSword.csv');
  weaponList.push(...weapon);
  console.log('Bow');
  weapon = await readCSV('../../csv/lz_card_CardBow.csv');
  weaponList.push(...weapon);
  console.log('Wand');
  weapon = await readCSV('../../csv/lz_card_CardWand.csv');
  weaponList.push(...weapon);
  console.log('Book');
  weapon = await readCSV('../../csv/lz_card_CardBook.csv');
  weaponList.push(...weapon);
  // console.log('weaponList',weaponList);

  for await (const weapon of weaponList) {
    await findWeapon(
      sheet,
      trimName(weapon['zh-tw']),
      trimName(weapon['en']),
      'en'
    );
    await findWeapon(
      sheet,
      trimName(weapon['zh-tw']),
      trimName(weapon['ja-jp']),
      'jp'
    );
  }
  // console.log(updatedCells);

  const sheet2 = doc.sheetsByIndex[0];
  await sheet2.loadCells(`A1:G${sheet2.rowCount}`);
  for await (const weapon of weaponList) {
    await findWeaponInMaterial(
      sheet2,
      trimName(weapon['zh-tw']),
      trimName(weapon['en']),
      'en'
    );
    await findWeaponInMaterial(
      sheet2,
      trimName(weapon['zh-tw']),
      trimName(weapon['ja-jp']),
      'jp'
    );
  }
};

const updateWeaponResources = async () => {
  const sheet = doc.sheetsByIndex[1];
  await sheet.loadCells(`A1:F${sheet.rowCount}`);
  console.log('item');
  const items = await readCSV('../../csv/lz_item.csv');
  // console.log(items)
  for await (const item of items) {
    await findMaterial(sheet, item['zh-tw'], item['en'], 'en');
    await findMaterial(sheet, item['zh-tw'], item['ja-jp'], 'jp');
  }

  const sheet2 = doc.sheetsByIndex[0];
  await sheet2.loadCells(`A1:D${sheet2.rowCount}`);
  for await (const item of items) {
    await findDropInMaterial(sheet2, item['zh-tw'], item['en'], 'en');
    await findDropInMaterial(sheet2, item['zh-tw'], item['ja-jp'], 'jp');
  }
};

auth(doc).then(async () => {
  await updateWeapon();
  await updateWeaponResources();
});
