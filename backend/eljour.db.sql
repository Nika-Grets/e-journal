BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "attandance" (
	"ID"	INTEGER,
	"student_ID"	INTEGER,
	"lesson_ID"	INTEGER,
	"status"	TEXT,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("lesson_ID") REFERENCES "lessons"("ID"),
	FOREIGN KEY("student_ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "classes" (
	"ID"	INTEGER,
	"level"	INTEGER,
	"letter"	TEXT,
	"curator_ID"	INTEGER,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("curator_ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "grades" (
	"ID"	INTEGER,
	"student_ID"	INTEGER,
	"lesson_ID"	INTEGER,
	"value"	INTEGER,
	"type"	TEXT,
	"comment"	TEXT,
	"created_at"	TEXT,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("lesson_ID") REFERENCES "lessons"("ID"),
	FOREIGN KEY("student_ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "homeworks" (
	"ID"	INTEGER,
	"lesson_ID"	INTEGER,
	"content"	TEXT,
	"deadline"	TEXT,
	"attachments"	TEXT,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("lesson_ID") REFERENCES "lessons"("ID")
);
CREATE TABLE IF NOT EXISTS "lesson_schedule" (
	"lesson_num"	INTEGER,
	"start_time"	TEXT,
	"duration"	INTEGER,
	"break_after"	INTEGER,
	PRIMARY KEY("lesson_num")
);
CREATE TABLE IF NOT EXISTS "lessons" (
	"ID"	INTEGER,
	"subject_ID"	INTEGER,
	"class_ID"	INTEGER,
	"teacher_ID"	INTEGER,
	"room"	TEXT,
	"date"	TEXT,
	"lesson_num"	INTEGER,
	"topic_ID"	INTEGER,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("class_ID") REFERENCES "classes"("ID"),
	FOREIGN KEY("subject_ID") REFERENCES "subjects"("ID"),
	FOREIGN KEY("teacher_ID") REFERENCES "users"("ID"),
	FOREIGN KEY("topic_ID") REFERENCES "topics"("ID")
);
CREATE TABLE IF NOT EXISTS "level" (
	"ID"	INTEGER,
	"level"	INTEGER,
	PRIMARY KEY("ID" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "parents_students" (
	"parent_ID"	INTEGER,
	"student_ID"	INTEGER,
	FOREIGN KEY("parent_ID") REFERENCES "users"("ID"),
	FOREIGN KEY("student_ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "permissions" (
	"ID"	INTEGER,
	"slug"	TEXT,
	"description"	TEXT,
	PRIMARY KEY("ID" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "profiles" (
	"ID"	INTEGER,
	"first_name"	TEXT,
	"last_name"	TEXT,
	"middle_name"	TEXT,
	"phone"	TEXT,
	"gender"	TEXT,
	FOREIGN KEY("ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_ID"	INTEGER,
	"permission_ID"	INTEGER,
	FOREIGN KEY("permission_ID") REFERENCES "permissions"("ID"),
	FOREIGN KEY("role_ID") REFERENCES "roles"("ID")
);
CREATE TABLE IF NOT EXISTS "roles" (
	"ID"	INTEGER,
	"name"	TEXT,
	"description"	TEXT,
	PRIMARY KEY("ID" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "school_config" (
	"key"	TEXT,
	"value"	TEXT,
	PRIMARY KEY("key")
);
CREATE TABLE IF NOT EXISTS "student_class" (
	"student_ID"	INTEGER,
	"class_ID"	INTEGER,
	"academic_year"	TEXT,
	FOREIGN KEY("class_ID") REFERENCES "classes"("ID"),
	FOREIGN KEY("student_ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "subjects" (
	"ID"	INTEGER,
	"name"	TEXT,
	"description"	TEXT,
	PRIMARY KEY("ID" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "teacher_subjects" (
	"teacher_ID"	INTEGER,
	"subject_ID"	INTEGER,
	FOREIGN KEY("subject_ID") REFERENCES "subjects"("ID"),
	FOREIGN KEY("teacher_ID") REFERENCES "users"("ID")
);
CREATE TABLE IF NOT EXISTS "topics" (
	"ID"	INTEGER,
	"subject_id"	INTEGER,
	"grade_level"	INTEGER,
	"order_index"	INTEGER,
	"title"	TEXT,
	"description"	TEXT,
	"hours_allocated"	NUMERIC,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("grade_level") REFERENCES "level"("ID"),
	FOREIGN KEY("subject_id") REFERENCES "subjects"("ID")
);
CREATE TABLE IF NOT EXISTS "users" (
	"ID"	INTEGER,
	"email"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"role_id"	INTEGER,
	"last_login"	TEXT,
	"is_active"	NUMERIC,
	PRIMARY KEY("ID" AUTOINCREMENT),
	FOREIGN KEY("role_id") REFERENCES "roles"("ID")
);
INSERT INTO "classes" VALUES (3,1,' А',9);
INSERT INTO "grades" VALUES (10,10,13,5,NULL,NULL,NULL);
INSERT INTO "grades" VALUES (11,10,14,2,NULL,NULL,NULL);
INSERT INTO "lesson_schedule" VALUES (1,'08:15',90,10);
INSERT INTO "lesson_schedule" VALUES (2,'09:55',90,10);
INSERT INTO "lesson_schedule" VALUES (3,'11:35',90,30);
INSERT INTO "lesson_schedule" VALUES (4,'13:35',90,10);
INSERT INTO "lesson_schedule" VALUES (5,'15:15',90,10);
INSERT INTO "lesson_schedule" VALUES (6,'16:55',90,10);
INSERT INTO "lessons" VALUES (13,2,3,9,'12','2026-03-02',1,NULL);
INSERT INTO "lessons" VALUES (14,2,3,9,'12','2026-03-09',1,NULL);
INSERT INTO "level" VALUES (2,1);
INSERT INTO "parents_students" VALUES (11,10);
INSERT INTO "parents_students" VALUES (11,12);
INSERT INTO "permissions" VALUES (1,'users:view_all','Просмотр всех пользователей');
INSERT INTO "permissions" VALUES (2,'users:manage','Создание и удаление пользователей');
INSERT INTO "permissions" VALUES (3,'users:link_parent','Привязать родителя к ученику');
INSERT INTO "permissions" VALUES (4,'grades:read_all','Просмотр всех оценок');
INSERT INTO "permissions" VALUES (5,'grades:read_class','Просмотр оценок своего класса');
INSERT INTO "permissions" VALUES (6,'grades:read_own','Просмотр своих оценок (ученик/родитель)');
INSERT INTO "permissions" VALUES (7,'grades:write','Выставление оценок');
INSERT INTO "permissions" VALUES (8,'attendance:read','Просмотр посещаемости');
INSERT INTO "permissions" VALUES (9,'attendance:write','Редактирование посещаемости');
INSERT INTO "permissions" VALUES (10,'schedule:view','Просмотр расписания');
INSERT INTO "permissions" VALUES (11,'schedule:manage','Редактирование расписания');
INSERT INTO "permissions" VALUES (12,'topics:read','Просмотр тем');
INSERT INTO "permissions" VALUES (13,'topics:manage_self','Управление своими темами');
INSERT INTO "permissions" VALUES (14,'topics:manage_all','Управление всеми темами');
INSERT INTO "permissions" VALUES (15,'homework:create','Создавать домашние задания');
INSERT INTO "permissions" VALUES (16,'homework:read','Просматривать домашние задания');
INSERT INTO "permissions" VALUES (17,'reports:full','Полные отчёты по успеваемости');
INSERT INTO "permissions" VALUES (18,'reports:class','Отчёты по своему классу');
INSERT INTO "permissions" VALUES (19,'subjects:view_all','Просмотр и управление всеми предметами');
INSERT INTO "profiles" VALUES (9,'Учитель','Тест',NULL,NULL,NULL);
INSERT INTO "profiles" VALUES (10,'Ученик','Тест',NULL,NULL,NULL);
INSERT INTO "profiles" VALUES (11,'Родитель','Тест',NULL,NULL,NULL);
INSERT INTO "profiles" VALUES (12,'Ученик2','Тест',NULL,NULL,NULL);
INSERT INTO "role_permissions" VALUES (1,1);
INSERT INTO "role_permissions" VALUES (1,2);
INSERT INTO "role_permissions" VALUES (1,3);
INSERT INTO "role_permissions" VALUES (1,4);
INSERT INTO "role_permissions" VALUES (1,5);
INSERT INTO "role_permissions" VALUES (1,7);
INSERT INTO "role_permissions" VALUES (1,8);
INSERT INTO "role_permissions" VALUES (1,9);
INSERT INTO "role_permissions" VALUES (1,10);
INSERT INTO "role_permissions" VALUES (1,11);
INSERT INTO "role_permissions" VALUES (1,12);
INSERT INTO "role_permissions" VALUES (1,13);
INSERT INTO "role_permissions" VALUES (1,14);
INSERT INTO "role_permissions" VALUES (1,15);
INSERT INTO "role_permissions" VALUES (1,16);
INSERT INTO "role_permissions" VALUES (1,17);
INSERT INTO "role_permissions" VALUES (1,18);
INSERT INTO "role_permissions" VALUES (1,19);
INSERT INTO "role_permissions" VALUES (2,1);
INSERT INTO "role_permissions" VALUES (2,4);
INSERT INTO "role_permissions" VALUES (2,5);
INSERT INTO "role_permissions" VALUES (2,7);
INSERT INTO "role_permissions" VALUES (2,8);
INSERT INTO "role_permissions" VALUES (2,9);
INSERT INTO "role_permissions" VALUES (2,10);
INSERT INTO "role_permissions" VALUES (2,11);
INSERT INTO "role_permissions" VALUES (2,12);
INSERT INTO "role_permissions" VALUES (2,13);
INSERT INTO "role_permissions" VALUES (2,15);
INSERT INTO "role_permissions" VALUES (2,16);
INSERT INTO "role_permissions" VALUES (2,18);
INSERT INTO "role_permissions" VALUES (3,6);
INSERT INTO "role_permissions" VALUES (3,8);
INSERT INTO "role_permissions" VALUES (3,10);
INSERT INTO "role_permissions" VALUES (3,12);
INSERT INTO "role_permissions" VALUES (3,16);
INSERT INTO "role_permissions" VALUES (4,6);
INSERT INTO "role_permissions" VALUES (4,8);
INSERT INTO "role_permissions" VALUES (4,10);
INSERT INTO "role_permissions" VALUES (4,16);
INSERT INTO "role_permissions" VALUES (2,17);
INSERT INTO "roles" VALUES (1,'ADMIN','Администратор школы');
INSERT INTO "roles" VALUES (2,'TEACHER','Учитель');
INSERT INTO "roles" VALUES (3,'STUDENT','Ученик');
INSERT INTO "roles" VALUES (4,'PARENT','Родитель');
INSERT INTO "school_config" VALUES ('type','90');
INSERT INTO "school_config" VALUES ('max_lessons','6');
INSERT INTO "student_class" VALUES (10,3,'2026-2027');
INSERT INTO "student_class" VALUES (12,3,'2026-2027');
INSERT INTO "subjects" VALUES (2,'Тестовый',NULL);
INSERT INTO "teacher_subjects" VALUES (9,2);
INSERT INTO "topics" VALUES (2,2,2,1,'Введение','',2);
INSERT INTO "users" VALUES (8,'admin@elzhur.ru','$2b$10$MC9x85anxmrxKR5kq/Qg6uTQGdV8Yd6OTLoKVG1flJ6FUskb4pL4W',1,'',NULL);
INSERT INTO "users" VALUES (9,'teacher@elzhur.ru','$2b$10$RMwKYp6PkpIKBrY.y2JvvOIzMi9WKKqE01.hzPxiKJ1Mw4ysE9Num',2,NULL,1);
INSERT INTO "users" VALUES (10,'student@elzhur.ru','$2b$10$kpKa2.RlPQ5wEgNDzKfoAuXef4nl3zHFvT/CNm/yVZBia5cV.3W8W',3,NULL,1);
INSERT INTO "users" VALUES (11,'parent@elzhur.ru','$2b$10$OsPOfteoKpdsuq2iWW/ixebvmLvy.c2Nt/biAs/FP4SpzlbKMEJ/.',4,NULL,1);
INSERT INTO "users" VALUES (12,'test@elzhur.ru','$2b$10$lRNVphsnNQuHcKJuQ1iHgu2d2qB8ZMzsDejQ1.2q.92E2rKfAgPpK',3,NULL,1);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_attendance_unique_entry" ON "attandance" (
	"student_ID",
	"lesson_ID"
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_grades_unique_entry" ON "grades" (
	"student_ID",
	"lesson_ID"
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_homeworks_lesson" ON "homeworks" (
	"lesson_ID"
);
COMMIT;
