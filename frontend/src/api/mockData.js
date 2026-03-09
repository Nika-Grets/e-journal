export const mockUsers = [
    { id: 1, fio: "Иванов Иван Иванович", role: "TEACHER", email: "teacher@school.ru" },
    { id: 2, fio: "Петров Петр", role: "STUDENT", email: "student@school.ru" },
];

export const mockClasses = [
    { id: 1, name: "10-А" },
    { id: 2, name: "11-Б" }
];

// Список уроков (колонки)
export const mockLessons = [
    { id: 101, date: '01.09', subjectId: 1, classId: 1 },
    { id: 102, date: '03.09', subjectId: 1, classId: 1 },
    { id: 103, date: '05.09', subjectId: 1, classId: 1 },
];

// Список учеников (строки)
export const mockStudents = [
    { id: 1, fio: 'Алексеев А.' },
    { id: 2, fio: 'Борисов Б.' },
];

// Оценки (связующее звено)
export const mockGrades = [
  { id: 1, studentId: 1, lessonId: 101, value: 5 }, // Алексеев за 01.09 получил 5
  { id: 2, studentId: 1, lessonId: 102, value: 4 }, // Алексеев за 03.09 получил 4
  { id: 3, studentId: 2, lessonId: 101, value: 3 }, // Борисов за 01.09 получил 3
];