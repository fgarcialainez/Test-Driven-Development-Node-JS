const fs = require('fs');
const path = require('path');
const config = require('config');
const FileService = require('../src/services/FileService');

const { uploadDir, profileDir } = config;

describe('createFolders', () => {
  it('Creates upload folder', () => {
    FileService.createFolders();
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  it('Creates profile folder under upload folder', () => {
    FileService.createFolders();
    const profileFolder = path.join('.', uploadDir, profileDir);
    expect(fs.existsSync(profileFolder)).toBe(true);
  });
});
