const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/models/User');
const SMTPServer = require('smtp-server').SMTPServer;
const User = require('../src/models/User');

// User activation email variables
let lastMail, server;
let simulateSmtpFailure = false;

// Callbacks to be run before tests
beforeAll(async () => {
  // Setup SMTP server
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  await server.listen(8587, 'localhost');

  // Synchronize the ORM with database
  await sequelize.sync();
});

beforeEach(() => {
  // Reset flag
  simulateSmtpFailure = false;

  // Clean database before each test
  return User.destroy({ truncate: true });
});

afterAll(async () => {
  // Close SMTP server connection
  await server.close();
});

const validUser = {
  username: 'user1',
  email: 'user1@email.com',
  password: 'P4ssword',
};

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/v1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(user);
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

  // Internationalization constants
  const username_null = 'Username can not be null';
  const username_size = 'Must have min 4 and max 32 characters';
  const email_null = 'Email can not be null';
  const email_invalid = 'Email is not valid';
  const password_null = 'Password can not be null';
  const password_size = 'Password must be at least 6 characters';
  const password_pattern =
    'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  const email_in_use = 'Email is in use';

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${'mail.com'}      | ${email_invalid}
    ${'email'}    | ${'user.mail.com'} | ${email_invalid}
    ${'email'}    | ${'user@mail'}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ssw'}         | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${'password'} | ${'1234567890'}    | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'} | ${password_pattern}
    ${'password'} | ${'lower4nd5667'}  | ${password_pattern}
    ${'password'} | ${'UPPER44444'}    | ${password_pattern}
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

  it(`Returns ${email_in_use} when same email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_in_use);
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

  it('Creates user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('Creates user in inactive mode even the request body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('Creates an activationToken for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('sends an Account activation email with activationToken', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail).toContain('user1@email.com');
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it('Returns 502 Bad Gateway when sending email fails', async () => {
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.status).toBe(502);
  });

  it('Returns email failure message when sending email fails', async () => {
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.body.message).toBe('Email failure');
  });

  it('Does not save user to database if activation email fails', async () => {
    simulateSmtpFailure = true;
    await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });
});

describe('Internationalization', () => {
  const username_null = 'Kullanıcı adı boş olamaz';
  const username_size = 'En az 4 en fazla 32 karakter olmalı';
  const email_null = 'E-Posta boş olamaz';
  const email_invalid = 'E-Posta geçerli değil';
  const password_null = 'Şifre boş olamaz';
  const password_size = 'Şifre en az 6 karakter olmalı';
  const password_pattern =
    'Şifrede en az 1 büyük, 1 küçük harf ve 1 sayı bulunmalıdır';
  const email_inuse = 'Bu E-Posta kullanılıyor';
  const user_create_success = 'Kullanıcı oluşturuldu';
  const email_failure = 'E-Posta gönderiminde hata oluştu';

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${username_null}
    ${'username'} | ${'usr'}           | ${username_size}
    ${'username'} | ${'a'.repeat(33)}  | ${username_size}
    ${'email'}    | ${null}            | ${email_null}
    ${'email'}    | ${'mail.com'}      | ${email_invalid}
    ${'email'}    | ${'user.mail.com'} | ${email_invalid}
    ${'email'}    | ${'user@mail'}     | ${email_invalid}
    ${'password'} | ${null}            | ${password_null}
    ${'password'} | ${'P4ssw'}         | ${password_size}
    ${'password'} | ${'alllowercase'}  | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
    ${'password'} | ${'1234567890'}    | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'} | ${password_pattern}
    ${'password'} | ${'lower4nd5667'}  | ${password_pattern}
    ${'password'} | ${'UPPER44444'}    | ${password_pattern}
  `(
    'Returns $expectedMessage when $field is $value when language is set as Turkish',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      };
      user[field] = value;
      const response = await postUser(user, { language: 'tr' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`Returns ${email_inuse} when same email is already in use when language is set as Turkish`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'tr' });
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`Returns success message of ${user_create_success} when signup request is valid and language is set as Turkish`, async () => {
    const response = await postUser({ ...validUser }, { language: 'tr' });
    expect(response.body.message).toBe(user_create_success);
  });

  it(`Returns ${email_failure} message when sending email fails and language is set as Turkish`, async () => {
    simulateSmtpFailure = true;
    const response = await postUser({ ...validUser }, { language: 'tr' });
    expect(response.body.message).toBe(email_failure);
  });
});

describe('Account Activation', () => {
  it('Activates the account when correct token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/v1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('Removes the token from user table after successful activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/v1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });

  it('Does not activate the account when token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    await request(app)
      .post('/api/v1.0/users/token/' + token)
      .send();
    const users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('Returns bad request when token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/v1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });

  it.each`
    language | tokenStatus  | message
    ${'tr'}  | ${'wrong'}   | ${'Bu hesap daha önce aktifleştirilmiş olabilir ya da token hatalı'}
    ${'en'}  | ${'wrong'}   | ${'This account is either active or the token is invalid'}
    ${'tr'}  | ${'correct'} | ${'Hesabınız aktifleştirildi'}
    ${'en'}  | ${'correct'} | ${'Account is activated'}
  `(
    'Returns $message when token is $tokenStatus and language is $language',
    async ({ language, tokenStatus, message }) => {
      await postUser();
      let token = 'this-token-does-not-exist';
      if (tokenStatus === 'correct') {
        let users = await User.findAll();
        token = users[0].activationToken;
      }
      const response = await request(app)
        .post('/api/v1.0/users/token/' + token)
        .set('Accept-Language', language)
        .send();
      expect(response.body.message).toBe(message);
    }
  );
});
