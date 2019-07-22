import { Router } from 'express';
import _ from 'lodash';

import logger from '../logger';

import Teacher from '../models/Teacher';
import Student from '../models/Student';
import Pair from '../models/Pair';

const routes = Router();

/**
 * Helper to retrieve email mentions in
 * a notification.
 *
 * @param {*} notification
 */
const retrieveEmails = notification => {
  const tokens = notification.split(' @');
  return tokens.filter(t => t.includes('@'));
};

/**
 * Registers or updates a student to a teacher
 */
routes.post('/register', async (req, res) => {
  try {
    const { teacher, students = [] } = req.body;

    // Upsert teacher
    const teacherPromise = Teacher.findOneAndUpdate(
      { email: teacher },
      { email: teacher },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Upsert students
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

/**
 * Retrieves the list of common students shared by teachers
 */
routes.get('/commonstudents', async (req, res) => {
  const { teachers = '' } = res.query;
  const teacherEmails = teachers.split(',');

  try {
    // Find student-teacher pairs
    const pairs = await Pair.find({
      teacherEmail: { $or: teacherEmails }
    });

    // Convert to student emails
    const students = pairs.map(p => p.studentEmail);

    return res.json({ students, message: 'success' });
  } catch (e) {
    logger.error(e);
    return res.error({ message: 'unsuccessful' });
  }
});

/**
 * Suspends a student.
 */
routes.post('/suspend', async (req, res) => {
  const { student: email } = req.body;
  try {
    // Check if student exists
    const studentExists = await Student.findOne({ email });

    if (!studentExists) {
      return res.error({ message: `No such student! Email=${email}` });
    }

    /**
     * Suspend student.
     */
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

/**
 * Retrieve students, from a given
 * notification and teacher email.
 */
routes.post('/retrievefornotifications', async (req, res) => {
  const { teacher: teacherEmail, notification } = req.body;

  try {
    const mentionedStudentEmails = retrieveEmails(notification);
    const studentEmails = await Pair.find({ teacherEmail }).map(pair => pair.studentEmail);
    const emailsToFind = _.uniq([...mentionedStudentEmails, ...studentEmails]);

    // Find students with given email, and not suspended.
    // Note we convert the array into a set,
    // To prevent duplicates in querying which can be
    // Bad in large n.
    const students = await Student.find({
      email: { $in: emailsToFind },
      dateSuspended: null
    });

    return {
      recipients: students.map(student => student.email)
    };
  } catch (e) {
    logger.error(e);
    return res.error({ message: 'unsuccessful' });
  }
});

export default routes;
