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

  it('Returns 400 when email is null', async () => {
    // Check if the endpoint returns a 400 when email is null
    const response = await postUser({
      username: 'user1',
      email: null,
      password: 'P4ssword',
    });

    expect(response.status).toBe(400);
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

  it.each([
    ['username', 'Username can not be null'],
    ['email', 'Email can not be null'],
    ['password', 'Password can not be null'],
  ])(
    'Returns validationErrors in body when %s is null',
    async (field, expectedMessage) => {
      const user = {
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      };
      user[field] = null;

      const response = await postUser(user);
      expect(response.body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username can not be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'Email can not be null'}
    ${'email'}    | ${'mail.com'}      | ${'Email is not valid'}
    ${'email'}    | ${'user.mail.com'} | ${'Email is not valid'}
    ${'email'}    | ${'user@mail'}     | ${'Email is not valid'}
    ${'password'} | ${null}            | ${'Password can not be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be at least 6 characters'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'1234567890'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerandUPPER'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lower4nd5667'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER44444'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `(
    'Returns $expectedMessage when $field is $value.',
    async ({ field, value, expectedMessage }) => {
      const user = {
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      };
      user[field] = value;

      const response = await postUser(user);
      expect(response.body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it('Returns email in use when same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('Email is in use');
  });

  it('Returns errors for both username is null and email are in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });

    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});
