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
  it('Returns 200 OK when signup request is valid', (done) => {
    request(app)
      .post('/api/v1.0/users')
      .send({
        username: 'users1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then((response) => {
        // Check the signup call response status code
        expect(response.status).toBe(200);
        done();
      });
  });

  it('Returns success message when signup request is valid', (done) => {
    request(app)
      .post('/api/v1.0/users')
      .send({
        username: 'users1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then((response) => {
        // Check the signup call response body
        expect(response.body.message).toBe('User created');
        done();
      });
  });

  it('Saves the user to database', (done) => {
    request(app)
      .post('/api/v1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then(() => {
        // Check if the user has been saved correctly
        User.findAll().then((userList) => {
          expect(userList.length).toBe(1);
          done();
        });
      });
  });

  it('Saves the username and email to database', (done) => {
    request(app)
      .post('/api/v1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then(() => {
        // Check if the username and email have been saved correctly
        User.findAll().then((userList) => {
          const savedUser = userList[0];

          expect(savedUser.username).toBe('user1');
          expect(savedUser.email).toBe('user1@email.com');

          done();
        });
      });
  });

  it('Hashes the password stored in database', (done) => {
    request(app)
      .post('/api/v1.0/users')
      .send({
        username: 'user1',
        email: 'user1@email.com',
        password: 'P4ssword',
      })
      .then(() => {
        // Check if the password has been saved as a hash
        User.findAll().then((userList) => {
          const savedUser = userList[0];

          expect(savedUser.password).not.toBe('P4ssword');

          done();
        });
      });
  });
});
