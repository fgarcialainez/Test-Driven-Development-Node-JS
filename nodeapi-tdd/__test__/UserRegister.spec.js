const request = require('supertest');
const app = require('../src/app');

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
        expect(response.body.message).toBe('User created');
        done();
      });
  });
});
