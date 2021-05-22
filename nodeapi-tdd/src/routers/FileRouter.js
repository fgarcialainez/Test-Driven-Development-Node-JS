const express = require('express');
const multer = require('multer');
const FileService = require('../services/FileService');

const router = express.Router();
const upload = multer();

router.post(
  '/api/v1.0/hoaxes/attachments',
  upload.single('file'),
  async (req, res) => {
    await FileService.saveAttachment(req.file);
    res.send();
  }
);

module.exports = router;
