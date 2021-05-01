const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/models/User');
const User = require('../src/models/User');

// Callbacks to be run before tests
beforeAll(() => {
  // Synchronize the ORM with database
  return sequelize.sync();
});

beforeEach(() => {
  // Clean database before each test
  return User.destroy({ truncate: true });
});

describe('User Registration', () => {
  const postValidateUser = () => {
    return request(app).post('/api/v1.0/users').send({
      username: 'user1',
      email: 'user1@email.com',
      password: 'P4ssword',
    });
  };

  it('Returns 200 OK when signup request is valid', async () => {
    // Check the signup call response status code
    const response = await postValidateUser();
    expect(response.status).toBe(200);
  });

  it('Returns success message when signup request is valid', async () => {
    // Check the signup call response body
    const response = await postValidateUser();
    expect(response.body.message).toBe('User created');
  });

  it('Saves the user to database', async () => {
    // Check if the user has been saved correctly
    await postValidateUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('Saves the username and email to database', async () => {
    // Check if the username and email have been saved correctly
    await postValidateUser();
    const userList = await User.findAll();
    const savedUser = userList[0];

    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@email.com');
  });

  it('Hashes the password stored in database', async () => {
    // Check if the password has been saved as a hash
    await postValidateUser();
    const userList = await User.findAll();
    const savedUser = userList[0];

    expect(savedUser.password).not.toBe('P4ssword');
  });
});
