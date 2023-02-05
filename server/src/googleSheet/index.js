const { GoogleSpreadsheet } = require('google-spreadsheet');

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

const auth = async (doc) => {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo(); // loads document properties and worksheets
  console.log('doc is ready', doc.title);
};

const getDistinctResourcesList = (sheet, likeResourceName, lang) => {
  console.log('getDistinctResourcesList', likeResourceName, lang);
  const distinctArray = [];
  const langIndex = lang == 'en' ? 2 : lang == 'jp' ? 3 : 1;
  for (let i = 1; i < sheet.rowCount; i++) {
    const cellResource = sheet.getCell(i, langIndex);
    const cellValue = cellResource.value;
    const compareCellValue =
      lang == 'en' ? cellValue?.toLowerCase() : cellValue;
    // console.log('cellValue', cellValue, compareCellValue);
    if (
      compareCellValue &&
      compareCellValue.includes(
        lang == 'en' ? likeResourceName.toLowerCase() : likeResourceName
      )
    ) {
      const resources = cellValue.split('/');
      resources.forEach((item) => {
        const name = item.replace(/\d+/, '');
        const compareName = lang == 'en' ? name.toLowerCase() : item;
        if (
          compareName.includes(
            lang == 'en' ? likeResourceName.toLowerCase() : likeResourceName
          ) &&
          !distinctArray.includes(name)
        ) {
          distinctArray.push(name);
        }
      });
    }
  }
  return distinctArray;
};

const getDistinctWeaponList = (sheet, likeWeaponName, lang) => {
  console.log('getDistinctWeaponList', likeWeaponName, lang);
  const distinctArray = [];
  const langIndex = lang == 'en' ? 1 : lang == 'jp' ? 2 : 0;
  for (let i = 1; i < sheet.rowCount; i++) {
    const cellResource = sheet.getCell(i, langIndex);
    const cellValue = cellResource.value;
    const compareCellValue =
      lang == 'en' ? cellValue?.toLowerCase() : cellValue;
    if (
      compareCellValue &&
      compareCellValue.includes(
        lang == 'en' ? likeWeaponName.toLowerCase() : likeWeaponName
      )
    ) {
      distinctArray.push(cellValue);
    }
  }
  return distinctArray;
};

const loopExactFind = (
  sheet,
  resourceName,
  lang,
  weaponName = null,
  weaponFirst = false
) => {
  // console.log(resourceName);
  let rowNo = 0;
  let amount = 0;
  let hasWeaponRowNo = 0;
  let hasWeaponAmount = 0;
  const maxChapterNo =
    lang == 'zh'
      ? parseInt(process.env.CHINESE_STAGE)
      : parseInt(process.env.GLOBAL_STAGE);
  const langIndex = lang == 'en' ? 2 : lang == 'jp' ? 3 : 1;
  const weaponIndex = lang == 'en' ? 5 : lang == 'jp' ? 6 : 4;
  const maxStageRow = getStageMax(sheet, maxChapterNo);
  // console.log('maxStageRow', maxStageRow);
  for (let i = 1; i < sheet.rowCount && i <= maxStageRow; i++) {
    const cellResource = sheet.getCell(i, langIndex);
    const cellValue = cellResource.value;
    if (cellValue && cellValue.includes(resourceName)) {
      // console.log(i, cellValue);
      // const re = /\s*(?:;\/|$)\s*/;
      const resources = cellValue.split('/');
      const exactRe = new RegExp(`^[0-9]+${resourceName}$`);
      const element = resources.find((item) => {
        // console.log('element:', item, 'result:', exactRe.test(item));
        return exactRe.test(item);
      });
      if (element) {
        const re2 = /\d+/;
        const number = element.match(re2);
        if (number) {
          const count = parseInt(number[0]);
          if (
            weaponName &&
            sheet.getCell(i, weaponIndex).value === weaponName &&
            count >= hasWeaponAmount
          ) {
            hasWeaponRowNo = i;
            hasWeaponAmount = count;
          }
          if (count >= amount) {
            rowNo = i;
            amount = count;
          }
        }
      }
    } else {
      continue; //not filled yet
    }
  }
  rowNo =
    weaponName &&
    (hasWeaponAmount === amount || (weaponFirst && hasWeaponAmount > 0))
      ? hasWeaponRowNo
      : rowNo;
  amount =
    weaponName && weaponFirst && hasWeaponAmount > 0 ? hasWeaponAmount : amount;
  const stage = sheet.getCell(rowNo, 0).value;
  const weaponGetFromStage = sheet.getCell(rowNo, weaponIndex).value;
  // console.log(
  //   'Loop Exact Found',
  //   weaponName,
  //   weaponGetFromStage,
  //   weaponName == weaponGetFromStage
  // );
  const findWithWeapon = weaponName ? weaponGetFromStage === weaponName : false;
  return {
    resourceName,
    stage,
    rowNo,
    amount,
    findWithWeapon,
  };
};

const findWeaponStages = (sheet, weaponName, lang) => {
  const result = [];
  const weaponIndex = lang == 'en' ? 5 : lang == 'jp' ? 6 : 4;
  for (let i = 1; i < sheet.rowCount; i++) {
    const weaponCell = sheet.getCell(i, weaponIndex);
    const weaponValue = weaponCell.value;
    // console.log(weaponValue);
    if (weaponValue && weaponValue.includes(weaponName)) {
      const weaponNameList = weaponValue.split('/');
      weaponNameList.forEach((element) => {
        if (element === weaponName) {
          const stageCell = sheet.getCell(i, 0);
          result.push(stageCell.value);
        }
      });
    }
  }
  return result;
};

const findResource = async (resourceName, lang) => {
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells(`A1:G${sheet.rowCount}`);
  const result = loopExactFind(sheet, resourceName, lang);

  return result;
};

const findLikeResource = async (likeResourceName, lang) => {
  const sheet = doc.sheetsByIndex[0];
  console.log(sheet.title);
  await sheet.loadCells(`A1:D${sheet.rowCount}`);
  const result = getDistinctResourcesList(sheet, likeResourceName, lang).sort();
  return result;
};

const findWeaponResource = async (weaponName, lang, weaponFirst) => {
  // console.log(weaponName);
  const weaponSheet = doc.sheetsByIndex[1];
  await weaponSheet.loadCells(`A1:G${weaponSheet.rowCount}`);

  const weaponObject = {
    weaponName: '',
    stages: [],
    resources: [],
  };
  const langIndex = lang == 'en' ? 1 : lang == 'jp' ? 2 : 0;
  const weaponIndex = lang == 'en' ? 4 : lang == 'jp' ? 5 : 3;
  for (let i = 1; i < weaponSheet.rowCount; i++) {
    const weaponNameCell = weaponSheet.getCell(i, langIndex);
    // console.log(weaponNameCell.value, weaponNameCell.value === weaponName);
    if (weaponNameCell.value === weaponName) {
      weaponObject.weaponName = weaponName;
      const resourcesNameCell = weaponSheet.getCell(i, weaponIndex);
      const resourcesNameValue = resourcesNameCell.value;
      // const re = /\s*(?:;\/|$)\s*/;
      const resources = resourcesNameValue.split('/');
      // console.log('resources', resourcesNameValue, 'split', resources);
      weaponObject.resources = resources.map((item) => ({
        resourceName: item.trim(),
        stage: '',
        amount: 0,
        findWithWeapon: false,
      }));
      break;
    }
  }
  if (!weaponObject.weaponName) {
    return false;
  }
  const resourceSheet = doc.sheetsByIndex[0];
  await resourceSheet.loadCells(`A1:G${resourceSheet.rowCount}`);
  weaponObject.resources.forEach((element) => {
    const item = loopExactFind(
      resourceSheet,
      element.resourceName,
      lang,
      weaponName,
      weaponFirst
    );
    element.stage = item.stage;
    element.amount = item.amount;
    element.findWithWeapon = item.findWithWeapon;
  });
  weaponObject.stages = findWeaponStages(resourceSheet, weaponName, lang);
  // console.log(weaponObject);
  return weaponObject;
};

const findLikeWeapon = async (likeWeaponName, lang) => {
  const sheet = doc.sheetsByIndex[1];
  console.log(sheet.title);
  await sheet.loadCells(`A1:C${sheet.rowCount}`);
  const result = getDistinctWeaponList(sheet, likeWeaponName, lang).sort();
  return result;
};

const getStageMax = (sheet, chapterNo) => {
  let result = 1;
  // console.log(chapterNo);
  for (let i = 1; i < sheet.rowCount; i++) {
    const stageCell = sheet.getCell(i, 0);
    const stageCellValue = stageCell.value;
    const stageChapter = stageCellValue.split('-')[1];
    if (stageChapter > chapterNo) {
      result = i - 1;
      break;
    }
    if (i == sheet.rowCount - 1) {
      result = sheet.rowCount - 1;
    }
  }
  return result;
};

//library
const getAllInformationList = async (lang) => {
  const sheet = doc.sheetsByIndex[3];
  console.log(sheet.title);
  await sheet.loadCells(`A1:C${sheet.rowCount}`);
  const array = [];
  const langIndex = lang == 'en' ? 1 : lang == 'jp' ? 2 : 0;
  for (let i = 1; i < sheet.rowCount; i++) {
    const cellInfo = sheet.getCell(i, langIndex);
    const cellValue = cellInfo.value;
    array.push(cellValue);
  }
  return [...new Set(array)];
};

const getInformation = async (informationName, lang) => {
  const sheet = doc.sheetsByIndex[3];
  await sheet.loadCells(`A1:G${sheet.rowCount}`);
  const stages = [];
  let reward = '';
  const langIndex = lang == 'en' ? 1 : lang == 'jp' ? 2 : 0;
  const stageIndex = 3;
  const rewardIndex = lang == 'en' ? 5 : lang == 'jp' ? 6 : 4;
  for (let i = 1; i < sheet.rowCount; i++) {
    const cellInfo = sheet.getCell(i, langIndex);
    const cellValue = cellInfo.value;
    if (cellValue === informationName) {
      const stage = sheet.getCell(i, stageIndex).value;
      stages.push(stage);
      reward = sheet.getCell(i, rewardIndex).value || '';
    }
  }
  return {
    name: informationName,
    reward,
    stages,
  };
};

auth(doc);

module.exports = {
  findResource,
  findLikeResource,
  findWeaponResource,
  findLikeWeapon,
  getAllInformationList,
  getInformation,
};
