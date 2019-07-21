import { Router } from 'express';
import Teacher from '../models/Teacher';
import Student from '../models/Student';
import Pair from '../models/Pair';
import logger from '../logger';
import { pathToFileURL } from 'url';

const routes = Router();

/**
 * GET home page
 */
routes.get('/', (req, res) => {
  res.json({ message: 'Welcome to starter-backend!' });
});

routes.post('/register', async (req, res) => {
  try {
    const { teacher, students = [] } = req.body;

    // Upsert teacher
    const teacherPromise = Teacher.findOneAndUpdate(
      { email: teacher },
      { email: teacher },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Upsert student
    const studentsPromises = students.map(async student =>
      Student.findOneAndUpdate(
        { email: student },
        { email: student },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    // Upsert pairs
    const pairsPromises = students.map(async student =>
      Pair.findByIdAndUpdate(
        { teacherEmail: student },
        { studentEmail: student },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all([].concat(teacherPromise, studentsPromises, pairsPromises));
    return res.json({ message: 'success' });
  } catch (e) {
    logger.error(e);
    return res.error({ message: 'unsuccessful' });
  }
});

routes.get('/commonstudents', async (req, res) => {
  const { teachers = '' } = res.query;
  const teacherEmails = teachers.split(',');

  try {
    const pairs = await Pair.find({ teacherEmail: { $or: teacherEmails } });
    const students = pairs.map(p => p.studentEmail);
    return res.json({ students, message: 'success' });
  } catch (e) {
    logger.error(e);
    return res.error({ message: 'unsuccessful' });
  }
});

routes.post('/suspend', async (req, res) => {
  const { student: email } = req.body;
  try {
    const studentExists = await Student.findOne({ email });

    if (!studentExists) {
      return res.error({ message: 'No such student!' });
    }

    await Student.findOneAndUpdate(
      { email },
      { email, dateSuspended: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ message: 'success' });
  } catch (e) {
    logger.error(e);
    return res.error({ message: 'unsuccessful' });
  }
});

routes.post('/retrievefornotifications', async (req, res) => {
  const { teacher: teacherEmail, notification } = req.body;

  try {
    // TODO implement
  } catch (e) {
    logger.error(e);
    return res.error({ message: 'unsuccessful' });
  }
});

/**
 * GET /list
 *
 * This is a sample route demonstrating
 * a simple approach to error handling and testing
 * the global error handler. You most certainly want to
 * create different/better error handlers depending on
 * your use case.
 */
routes.get('/list', (req, res, next) => {
  const { title } = req.query;

  if (title == null || title === '') {
    // You probably want to set the response HTTP status to 400 Bad Request
    // or 422 Unprocessable Entity instead of the default 500 of
    // the global error handler (e.g check out https://github.com/kbariotis/throw.js).
    // This is just for demo purposes.
    next(new Error('The "title" parameter is required'));
    return;
  }

  res.render('index', { title });
});

export default routes;
