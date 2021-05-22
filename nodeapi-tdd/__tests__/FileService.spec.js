const fs = require('fs');
const path = require('path');
const config = require('config');
const FileAttachment = require('../src/models/FileAttachment');
const Hoax = require('../src/models/Hoax');
const User = require('../src/models/User');
const FileService = require('../src/services/FileService');

const { uploadDir, profileDir, attachmentDir } = config;
const profileFolder = path.join('.', uploadDir, profileDir);
const attachmentFolder = path.join('.', uploadDir, attachmentDir);

describe('Create Folders', () => {
  it('Creates upload folder', () => {
    FileService.createFolders();
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  it('Creates profile folder under upload folder', () => {
    FileService.createFolders();
    expect(fs.existsSync(profileFolder)).toBe(true);
  });

  it('Creates attachments folder under upload folder', () => {
    FileService.createFolders();
    expect(fs.existsSync(attachmentFolder)).toBe(true);
  });
});

describe('Scheduled unused file clean up', () => {
  const filename = 'test-file' + Date.now();
  const testFile = path.join('.', '__tests__', 'resources', 'test-png.png');
  const targetPath = path.join(attachmentFolder, filename);

  beforeEach(async () => {
    await FileAttachment.destroy({ truncate: true });
    await User.destroy({ truncate: { cascade: true } });
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  });

  const addHoax = async () => {
    const user = await User.create({
      username: `user1`,
      email: `user1@mail.com`,
    });
    const hoax = await Hoax.create({
      content: `hoax content 1`,
      timestamp: Date.now(),
      userId: user.id,
    });
    return hoax.id;
  };

  it('Removes the 24 hours old file with attachment entry if not used in hoax', async (done) => {
    jest.useFakeTimers();

    fs.copyFileSync(testFile, targetPath);
    const uploadDate = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1);
    const attachment = await FileAttachment.create({
      filename: filename,
      uploadDate: uploadDate,
    });
    await FileService.removeUnusedAttachments();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 5000);
    jest.useRealTimers();
    setTimeout(async () => {
      const attachmentAfterRemove = await FileAttachment.findOne({
        where: { id: attachment.id },
      });
      expect(attachmentAfterRemove).toBeNull();
      expect(fs.existsSync(targetPath)).toBe(false);
      done();
    }, 1000);
  });

  it('Keeps the files younger than 24 hours and their database entry even not associated with hoax', async (done) => {
    jest.useFakeTimers();
    fs.copyFileSync(testFile, targetPath);
    const uploadDate = new Date(Date.now() - 23 * 60 * 60 * 1000);
    const attachment = await FileAttachment.create({
      filename: filename,
      uploadDate: uploadDate,
    });
    await FileService.removeUnusedAttachments();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 5000);
    jest.useRealTimers();
    setTimeout(async () => {
      const attachmentAfterRemove = await FileAttachment.findOne({
        where: { id: attachment.id },
      });
      expect(attachmentAfterRemove).not.toBeNull();
      expect(fs.existsSync(targetPath)).toBe(true);
      done();
    }, 1000);
  });

  it('Keeps the files older than 24 hours and their database entry if associated with hoax', async (done) => {
    jest.useFakeTimers();
    fs.copyFileSync(testFile, targetPath);
    const id = await addHoax();
    const uploadDate = new Date(Date.now() - 23 * 60 * 60 * 1000);
    const attachment = await FileAttachment.create({
      filename: filename,
      uploadDate: uploadDate,
      hoaxId: id,
    });
    await FileService.removeUnusedAttachments();
    jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 5000);
    jest.useRealTimers();
    setTimeout(async () => {
      const attachmentAfterRemove = await FileAttachment.findOne({
        where: { id: attachment.id },
      });
      expect(attachmentAfterRemove).not.toBeNull();
      expect(fs.existsSync(targetPath)).toBe(true);
      done();
    }, 1000);
  });
});
