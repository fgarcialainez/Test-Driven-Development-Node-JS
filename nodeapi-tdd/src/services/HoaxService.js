const Hoax = require('../models/Hoax');

const save = async (body, user) => {
  const hoax = {
    content: body.content,
    timestamp: Date.now(),
    userId: user.id,
  };
  await Hoax.create(hoax);
};

module.exports = { save };
