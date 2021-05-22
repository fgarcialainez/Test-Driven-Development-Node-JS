const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const User = require('../src/models/User');
const Token = require('../src/models/Token');
const sequelize = require('../src/config/database');
const en = require('../locales/en/translation.json');
const tr = require('../locales/tr/translation.json');

beforeAll(async () => {
  if (process.env.NODE_ENV === 'test') {
    await sequelize.sync();
  }
});

beforeEach(async () => {
  await User.destroy({ truncate: { cascade: true } });
});

const activeUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
  inactive: false,
};

const credentials = { email: 'user1@mail.com', password: 'P4ssword' };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  return await User.create(user);
};

const auth = async (options = {}) => {
  let token;
  if (options.auth) {
    const response = await request(app)
      .post('/api/v1.0/auth')
      .send(options.auth);
    token = response.body.token;
  }
  return token;
};

const deleteUser = async (id = 5, options = {}) => {
  const agent = request(app).delete('/api/v1.0/users/' + id);
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send();
};

describe('User Delete', () => {
  it('Returns forbidden when request sent unauthorized', async () => {
    const response = await deleteUser();
    expect(response.status).toBe(403);
  });

  it.each`
    language | message
    ${'tr'}  | ${tr.unauthorized_user_delete}
    ${'en'}  | ${en.unauthorized_user_delete}
  `(
    'Returns error body with $message for unauthorized request when language is $language',
    async ({ language, message }) => {
      const nowInMillis = new Date().getTime();
      const response = await deleteUser(5, { language });
      expect(response.body.path).toBe('/api/v1.0/users/5');
      expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
      expect(response.body.message).toBe(message);
    }
  );

  it('Returns forbidden when delete request is sent with correct credentials but for different user', async () => {
    await addUser();
    const userToBeDelete = await addUser({
      ...activeUser,
      username: 'user2',
      email: 'user2@mail.com',
    });
    const token = await auth({ auth: credentials });
    const response = await deleteUser(userToBeDelete.id, { token: token });
    expect(response.status).toBe(403);
  });

  it('Returns 403 when token is not valid', async () => {
    const response = await deleteUser(5, { token: '123' });
    expect(response.status).toBe(403);
  });

  it('Returns 200 ok when delete request sent from authorized user', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: credentials });
    const response = await deleteUser(savedUser.id, { token: token });
    expect(response.status).toBe(200);
  });

  it('Deletes user from database when request sent from authorized user', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: credentials });
    await deleteUser(savedUser.id, { token: token });

    const inDBUser = await User.findOne({ where: { id: savedUser.id } });
    expect(inDBUser).toBeNull();
  });

  it('Deletes token from database when delete user request sent from authorized user', async () => {
    const savedUser = await addUser();
    const token = await auth({ auth: credentials });
    await deleteUser(savedUser.id, { token: token });

    const tokenInDB = await Token.findOne({ where: { token: token } });
    expect(tokenInDB).toBeNull();
  });

  it('Deletes all tokens from database when delete user request sent from authorized user', async () => {
    const savedUser = await addUser();
    const token1 = await auth({ auth: credentials });
    const token2 = await auth({ auth: credentials });
    await deleteUser(savedUser.id, { token: token1 });

    const tokenInDB = await Token.findOne({ where: { token: token2 } });
    expect(tokenInDB).toBeNull();
  });
});
