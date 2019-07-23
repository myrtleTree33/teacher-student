import request from 'supertest';
import { Mongoose } from 'mongoose';
import { Mockgoose } from 'mock-mongoose';
import app from '../src/app';

// const mongoose = new Mongoose();
// const mockgoose = new Mockgoose(mongoose);

// beforeAll(done => {
//   mockgoose.prepareStorage().then(() => {
//     mongoose.connect('mongodb://example.com/TestingDB', err => {
//       done(err);
//     });
//   });
// });

describe('GET /api/register', () => {
  it('should register properly', async () => {
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);
  });
});

// describe('GET /list', () => {
//   it('should render properly with valid parameters', async () => {
//     await request(app)
//       .get('/list')
//       .query({ title: 'List title' })
//       .expect(200);
//   });

//   it('should error without a valid parameter', async () => {
//     await request(app)
//       .get('/list')
//       .expect(500);
//   });
// });

// describe('GET /404', () => {
//   it('should return 404 for non-existent URLs', async () => {
//     await request(app)
//       .get('/404')
//       .expect(404);
//     await request(app)
//       .get('/notfound')
//       .expect(404);
//   });
// });
