import request from 'supertest';
import app from '../src/app';
import Pair from '../src/models/Pair';
import Student from '../src/models/Student';
import Teacher from '../src/models/Teacher';

beforeEach(async done => {
  await Promise.all([Pair.remove({}), Student.remove({}), Teacher.remove({})]);
  done();
});

afterAll(async done => {
  // Clean up DB connection after done
  // mongoose.connection.close();
  done();
});

describe('GET /api/register', () => {
  it('should register 1 teacher and students properly', async () => {
    expect(await Pair.find({}).count()).toBe(0);

    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    expect(await Pair.find({}).count()).toBe(2);
    expect(await Pair.find({ teacherEmail: 'teacherken@gmail.com' }).count()).toBe(2);
    expect(await Pair.find({ teacherEmail: 'teacherKen@gmail.com' }).count()).toBe(0);
    expect(await Pair.find({ studentEmail: 'studenthon@gmail.com' }).count()).toBe(1);
    expect(await Pair.find({ studentEmail: 'studentjon@gmail.com' }).count()).toBe(1);
  });

  it('should ignore duplicate students and teachers', async () => {
    expect(await Pair.find({}).count()).toBe(0);

    // Make call once
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    // Make call twice
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    expect(await Pair.find({}).count()).toBe(2);
    expect(await Pair.find({ teacherEmail: 'teacherken@gmail.com' }).count()).toBe(2);
    expect(await Pair.find({ teacherEmail: 'teacherKen@gmail.com' }).count()).toBe(0);
    expect(await Pair.find({ studentEmail: 'studenthon@gmail.com' }).count()).toBe(1);
    expect(await Pair.find({ studentEmail: 'studentjon@gmail.com' }).count()).toBe(1);
  });
});

describe('GET /api/commonstudents', () => {
  it('should retrieve records for 1 teacher properly', async () => {
    // Insert teacher entry
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    await request(app)
      .get('/api/commonstudents')
      .query({ teachers: 'teacherken@gmail.com' })
      .expect(200, {
        students: ['studentjon@gmail.com', 'studenthon@gmail.com'],
        message: 'success'
      });

    expect(await Pair.find({}).count()).toBe(2);
    expect(await Pair.find({ studentEmail: 'studentjon@gmail.com' }).count()).toBe(1);
  });

  it('should retrieve records for 2 teachers properly', async () => {
    // Insert teacher entry
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    // Insert a second teacher entry
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'mary@gmail.com',
        students: ['aaa@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    await request(app)
      .get('/api/commonstudents')
      .query({ teachers: 'teacherken@gmail.com,mary@gmail.com' })
      .expect(200, {
        students: ['studenthon@gmail.com'],
        message: 'success'
      });

    expect(await Pair.find({}).count()).toBe(4);
  });
});

describe('POST /api/suspend', () => {
  it('should suspend a record for a student', async () => {
    // Insert teacher entry
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    expect(await Student.find({ email: 'studenthon@gmail.com' }).count()).toBe(1);
    expect((await Student.find({ email: 'studenthon@gmail.com' }))[0]).toHaveProperty(
      'dateSuspended',
      null
    );

    await request(app)
      .post('/api/suspend')
      .send({
        student: 'studenthon@gmail.com'
      })
      .expect(200, {
        message: 'success'
      });

    expect((await Student.find({ email: 'studenthon@gmail.com' }))[0].dateSuspended).toBeTruthy();
  });
});

describe('POST /api/retrievefornotifications', () => {
  it('should retrieve notifications for 1 teacher and hashtagged properly', async () => {
    // Insert teacher entries
    await request(app)
      .post('/api/register')
      .send({
        teacher: 'teacherken@gmail.com',
        students: ['studentjon@gmail.com', 'studenthon@gmail.com']
      })
      .expect(200);

    await request(app)
      .post('/api/register')
      .send({
        teacher: 'mary@gmail.com',
        students: ['aaa@gmail.com', 'bbb@gmail.com']
      })
      .expect(200);

    await request(app)
      .post('/api/retrievefornotifications')
      .send({
        teacher: 'teacherken@gmail.com',
        notification: 'Hello students! @aaa@gmail.com @bbb@gmail.com'
      })
      .expect(200, {
        recipients: [
          'aaa@gmail.com',
          'bbb@gmail.com',
          'studenthon@gmail.com',
          'studentjon@gmail.com'
        ]
      });
  });
});
