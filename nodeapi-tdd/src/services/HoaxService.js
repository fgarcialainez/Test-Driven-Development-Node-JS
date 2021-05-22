const Hoax = require('../models/Hoax');

const save = async (body) => {
  const hoax = {
    content: body.content,
    timestamp: Date.now(),
  };
  await Hoax.create(hoax);
};

module.exports = { save };
