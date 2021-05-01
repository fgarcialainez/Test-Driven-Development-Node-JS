const bcrypt = require('bcrypt');
const User = require('../models/User');

const save = async (body) => {
  // Hash the password
  const hash = await bcrypt.hash(body.password, 10);

  // Create the user object
  const user = Object.assign({}, body, { password: hash });

  // Save the user to the database
  await User.create(user);
};

module.exports = { save };
