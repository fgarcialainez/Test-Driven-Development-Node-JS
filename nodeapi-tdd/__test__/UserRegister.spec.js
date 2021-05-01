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

const validUser = {
  username: 'user1',
  email: 'user1@email.com',
  password: 'P4ssword',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/v1.0/users').send(user);
};

describe('User Registration', () => {
  it('Returns 200 OK when signup request is valid', async () => {
    // Check the signup call response status code
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('Returns success message when signup request is valid', async () => {
    // Check the signup call response body
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('Saves the user to database', async () => {
    // Check if the user has been saved correctly
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('Saves the username and email to database', async () => {
    // Check if the username and email have been saved correctly
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];

    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@email.com');
  });

  it('Hashes the password stored in database', async () => {
    // Check if the password has been saved as a hash
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];

    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('Returns 400 when username is null', async () => {
    // Check if the endpoint returns a 400 when username is null
    const response = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'P4ssword',
    });

    expect(response.status).toBe(400);
  });

  it('Returns validationErrors in body when username is null', async () => {
    // Check if the endpoint returns validationErrors in the body when username is null
    const response = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'P4ssword',
    });

    expect(response.body.validationErrors).not.toBeUndefined();
    expect(response.body.validationErrors.username).toBe(
      'Username can not be null'
    );
  });

  it('Returns 400 when email is null', async () => {
    // Check if the endpoint returns a 400 when email is null
    const response = await postUser({
      username: 'user1',
      email: null,
      password: 'P4ssword',
    });

    expect(response.status).toBe(400);
  });

  it('Returns validationErrors in body when email is null', async () => {
    // Check if the endpoint returns validationErrors in the body when email is null
    const response = await postUser({
      username: 'user1',
      email: null,
      password: 'P4ssword',
    });

    expect(response.body.validationErrors).not.toBeUndefined();
    expect(response.body.validationErrors.email).toBe('Email can not be null');
  });

  it('Returns validationErrors in body when email and password are null', async () => {
    // Check if the endpoint returns validationErrors in the body when email and password are null
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });

    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});
