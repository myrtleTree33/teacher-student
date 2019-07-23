import { Router } from 'express';
import _ from 'lodash';

import logger from '../logger';

import Teacher from '../models/Teacher';
import Student from '../models/Student';
import Pair from '../models/Pair';
import { rejects } from 'assert';

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

    if (!teacher) {
      throw new Error('No teacher specified!');
    }

    // Upsert teacher
    const teacherPromise = Teacher.findOneAndUpdate(
      { email: teacher },
      { email: teacher },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Upsert students
    const studentsPromises = students.filter(Boolean).map(async student => {
      if (!student) {
        return null;
      }

      return Student.findOneAndUpdate(
        { email: student },
        { email: student },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    // Upsert pairs
    const pairsPromises = students
      .filter(Boolean)
      .map(async student =>
        Pair.findOneAndUpdate(
          { teacherEmail: teacher, studentEmail: student },
          { teacherEmail: teacher, studentEmail: student },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      );

    await Promise.all([].concat(teacherPromise, studentsPromises, pairsPromises));

    return res.json({ message: 'success' });
  } catch (e) {
    logger.error(e.message);
    res.status(400).json({ message: e.message });
  }
});

/**
 * Retrieves the list of common students shared by teachers
 */
routes.get('/commonstudents', async (req, res) => {
  try {
    const { teachers = '' } = req.query;
    const teacherEmails = teachers.split(',');

    // Find student-teacher pairs
    const pairs = await Pair.find({
      teacherEmail: { $in: teacherEmails }
    });

    // Convert to student emails
    const students = pairs.map(p => p.studentEmail);

    return res.json({ students, message: 'success' });
  } catch (e) {
    logger.error(e.message);
    res.status(400).json({ message: e.message });
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
      throw new Error(`No such student! Email=${email}`);
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
    logger.error(e.message);
    res.status(400).json({ message: e.message });
  }
});

/**
 * Retrieve students, from a given
 * notification and teacher email.
 */
routes.post('/retrievefornotifications', async (req, res) => {
  const { teacher: teacherEmail, notification } = req.body;

  try {
    // Emails by mention
    const mentionedStudentEmails = retrieveEmails(notification);

    // Emails by teacher
    let studentEmails = await Pair.find({ teacherEmail });
    studentEmails = studentEmails.map(pair => pair.studentEmail);

    // Coalesce and turn into set
    const emailsToFind = _.uniq([...mentionedStudentEmails, ...studentEmails]);

    // Find students with given email, and not suspended.
    // Note we convert the array into a set,
    // To prevent duplicates in querying which can be
    // Bad in large n.
    const students = await Student.find({
      email: { $in: emailsToFind },
      dateSuspended: null
    });

    // Get emails
    const recipients = students.map(student => student.email);

    return res.json({
      recipients
    });
  } catch (e) {
    logger.error(e.message);
    res.status(400).json({ message: e.message });
  }
});

export default routes;
