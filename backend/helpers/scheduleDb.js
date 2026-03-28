// Слой доступа к данным для расписания.
// Все SQL-запросы собраны здесь — роуты остаются тонкими.
const { Sequelize } = require('sequelize');

/**
 * @param {Sequelize} sequelize
 */
function makeScheduleDb(sequelize) {
  const Q = Sequelize.QueryTypes;

  // Получить метаданные: предметы, учителя, классы, конфиг
  async function getMeta() {
    const [subjects, teachers, classes, configRows] = await Promise.all([
      sequelize.query('SELECT ID, name FROM subjects ORDER BY name', { type: Q.SELECT }),
      sequelize.query(
        `SELECT 
    u.ID,
    p.last_name || ' ' || SUBSTR(p.first_name,1,1) || '.' AS name,
    GROUP_CONCAT(ts.subject_ID) AS subject_ids 
FROM users u 
JOIN profiles p ON u.ID = p.ID 
LEFT JOIN teacher_subjects ts ON u.ID = ts.teacher_ID 
WHERE u.role_id = (SELECT ID FROM roles WHERE name = 'TEACHER') 
GROUP BY u.ID 
ORDER BY name; `,
        { type: Q.SELECT }
      ),
      sequelize.query(
        `SELECT c.ID, c.level, c.letter, c.curator_ID,
                p.last_name || ' ' || SUBSTR(p.first_name,1,1) || '.' AS curator_name
         FROM classes c LEFT JOIN profiles p ON c.curator_ID = p.ID
         ORDER BY c.level, c.letter`,
        { type: Q.SELECT }
      ),
      sequelize.query('SELECT * FROM school_config', { type: Q.SELECT }),
    ]);
    const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    return { subjects, teachers, classes, config };
  }

  // Уроки класса за диапазон дат
  async function getLessonsByClass(classId, startDate, endDate) {
    return sequelize.query(
      `SELECT l.*, s.name AS subject_name,
              p.last_name || ' ' || SUBSTR(p.first_name,1,1) || '.' AS teacher_name,
              t.title AS topic_title,
              c.level || c.letter AS class_name,
              ls.start_time,
              h.content   AS homework_content,
              h.deadline  AS homework_deadline,
              h.attachments AS homework_files
       FROM lessons l
       LEFT JOIN subjects   s  ON l.subject_ID  = s.ID
       LEFT JOIN profiles   p  ON l.teacher_ID  = p.ID
       LEFT JOIN topics     t  ON l.topic_ID    = t.ID
       LEFT JOIN classes    c  ON l.class_ID    = c.ID
       LEFT JOIN lesson_schedule ls ON ls.lesson_num = l.lesson_num
       LEFT JOIN homeworks  h  ON h.lesson_ID   = l.ID
       WHERE l.class_ID = ? AND l.date BETWEEN ? AND ?
       ORDER BY l.date, l.lesson_num`,
      { replacements: [classId, startDate, endDate], type: Q.SELECT }
    );
  }

  // Личное расписание учителя за диапазон дат
  async function getLessonsByTeacher(teacherId, startDate, endDate) {
    return sequelize.query(
      `SELECT l.*, s.name AS subject_name,
              c.level || c.letter AS class_name,
              c.level AS grade_level,
              t.title AS topic_title, ls.start_time,
              h.ID AS homework_id, h.content AS homework_content,
              h.deadline AS homework_deadline, h.attachments AS homework_files
       FROM lessons l
       LEFT JOIN subjects        s  ON l.subject_ID  = s.ID
       LEFT JOIN classes         c  ON l.class_ID    = c.ID
       LEFT JOIN topics          t  ON l.topic_ID    = t.ID
       LEFT JOIN lesson_schedule ls ON ls.lesson_num = l.lesson_num
       LEFT JOIN homeworks       h  ON h.lesson_ID   = l.ID
       WHERE l.teacher_ID = ? AND l.date BETWEEN ? AND ?
       ORDER BY l.date, l.lesson_num`,
      { replacements: [teacherId, startDate, endDate], type: Q.SELECT }
    );
  }

  // Темы предмета для конкретного уровня класса
  // BUGFIX: topics.grade_level — это FK на level.ID, а не само число уровня.
  // Поэтому делаем JOIN через level, чтобы сравнивать по фактическому числу класса.
  async function getTopics(subjectId, gradeLevel) {
    return sequelize.query(
      `SELECT t.ID, t.title, t.hours_allocated
       FROM topics t
       JOIN level lv ON t.grade_level = lv.ID
       WHERE t.subject_id = ? AND lv.level = ?
       ORDER BY t.order_index`,
      { replacements: [subjectId, gradeLevel], type: Q.SELECT }
    );
  }

  // Проверка конфликта учителя в слоте (date + lesson_num)
  async function findTeacherConflict(teacherId, date, lessonNum, excludeId) {
    return sequelize.query(
      `SELECT l.ID, c.level || c.letter AS class_name
       FROM lessons l JOIN classes c ON l.class_ID = c.ID
       WHERE l.teacher_ID = ? AND l.date = ? AND l.lesson_num = ? AND l.ID != ?`,
      { replacements: [teacherId, date, lessonNum, excludeId || -1], type: Q.SELECT }
    );
  }

  // Проверка конфликта кабинета в слоте
  async function findRoomConflict(room, date, lessonNum, excludeId) {
    return sequelize.query(
      `SELECT l.ID, c.level || c.letter AS class_name
       FROM lessons l JOIN classes c ON l.class_ID = c.ID
       WHERE l.room = ? AND l.date = ? AND l.lesson_num = ? AND l.ID != ?`,
      { replacements: [room, date, lessonNum, excludeId || -1], type: Q.SELECT }
    );
  }

  // Создать или обновить урок
  async function upsertLesson({ ID, class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID }) {
    if (ID) {
      await sequelize.query(
        'UPDATE lessons SET subject_ID=?, teacher_ID=?, room=?, topic_ID=? WHERE ID=?',
        { replacements: [subject_ID || null, teacher_ID || null, room || null, topic_ID || null, ID] }
      );
    } else {
      await sequelize.query(
        'INSERT INTO lessons (class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID) VALUES (?,?,?,?,?,?,?)',
        { replacements: [class_ID, subject_ID || null, teacher_ID || null, date, lesson_num, room || null, topic_ID || null], type: Q.INSERT }
      );
    }
  }

  // Уроки класса за неделю (для копирования)
  async function getWeekLessons(classId, startDate, endDate) {
    return sequelize.query(
      'SELECT * FROM lessons WHERE class_ID = ? AND date BETWEEN ? AND ?',
      { replacements: [classId, startDate, endDate], type: Q.SELECT }
    );
  }

  // Проверить, занят ли слот (дата + номер урока + класс)
  async function slotExists(classId, date, lessonNum, transaction) {
    const [row] = await sequelize.query(
      'SELECT ID FROM lessons WHERE class_ID = ? AND date = ? AND lesson_num = ?',
      { replacements: [classId, date, lessonNum], type: Q.SELECT, transaction }
    );
    return !!row;
  }

  // Скопировать урок в новую дату
  async function insertLesson(lesson, newDate, transaction) {
    await sequelize.query(
      'INSERT INTO lessons (class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID) VALUES (?,?,?,?,?,?,?)',
      {
        replacements: [lesson.class_ID, lesson.subject_ID, lesson.teacher_ID, newDate, lesson.lesson_num, lesson.room, lesson.topic_ID],
        type: Q.INSERT,
        transaction,
      }
    );
  }

  // Получить ДЗ по уроку
  async function getHomework(lessonId) {
    const rows = await sequelize.query(
      'SELECT * FROM homeworks WHERE lesson_ID = ? LIMIT 1',
      { replacements: [lessonId], type: Q.SELECT }
    );
    return rows[0] || null;
  }

  // Сохранить или обновить ДЗ
  async function upsertHomework(lessonId, content, deadline, attachments) {
    const [existing] = await sequelize.query(
      'SELECT ID FROM homeworks WHERE lesson_ID = ?',
      { replacements: [lessonId], type: Q.SELECT }
    );
    if (existing) {
      await sequelize.query(
        'UPDATE homeworks SET content=?, deadline=?, attachments=? WHERE lesson_ID=?',
        { replacements: [content, deadline, JSON.stringify(attachments || []), lessonId] }
      );
    } else {
      await sequelize.query(
        'INSERT INTO homeworks (lesson_ID, content, deadline, attachments) VALUES (?,?,?,?)',
        { replacements: [lessonId, content, deadline, JSON.stringify(attachments || [])], type: Q.INSERT }
      );
    }
  }

  return {
    getMeta, getLessonsByClass, getLessonsByTeacher, getTopics,
    findTeacherConflict, findRoomConflict, upsertLesson,
    getWeekLessons, slotExists, insertLesson,
    getHomework, upsertHomework,
  };
}

module.exports = makeScheduleDb;
