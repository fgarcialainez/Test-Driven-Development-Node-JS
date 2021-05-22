const Hoax = require('../models/Hoax');
const User = require('../models/User');
const FileService = require('../services/FileService');
const NotFoundException = require('../exceptions/NotFoundException');

const save = async (body, user) => {
  const hoax = {
    content: body.content,
    timestamp: Date.now(),
    userId: user.id,
  };
  const { id } = await Hoax.create(hoax);
  if (body.fileAttachment) {
    await FileService.associateFileToHoax(body.fileAttachment, id);
  }
};

const getHoaxes = async (page, size, userId) => {
  let where = {};

  if (userId) {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('user_not_found');
    }
    where = { id: userId };
  }

  const hoaxesWithCount = await Hoax.findAndCountAll({
    attributes: ['id', 'content', 'timestamp'],
    include: {
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'image'],
      where,
    },
    order: [['id', 'DESC']],
    limit: size,
    offset: page * size,
  });
  return {
    content: hoaxesWithCount.rows,
    page,
    size,
    totalPages: Math.ceil(hoaxesWithCount.count / size),
  };
};

module.exports = { save, getHoaxes };
