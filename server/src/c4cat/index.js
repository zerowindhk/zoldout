var express = require('express');
var router = express.Router();

router.use((req, res, next) => {
  next();
});

router.get('/', (req, res) => {
  getUserinfo(req.body.userId).then((result) => {
    res.json(result);
  });
});

const getUserinfo = async (userId) => {
  const response = await fetch('https://code-zoldout.c4-cat.com/Home/Login', {
    method: 'POST',
    body: { userId },
  });
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const userInfoTable = doc.querySelector('#userInfoTable');
  console.log(userInfoTable);
  return {
    userId: userId,
    userName: '',
    lastLogin: '',
    isRecentLogin: false,
  };
};

module.exports = router;
