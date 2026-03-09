// src/pages/Schedule/index.jsx
import React from 'react';
import { canManageSchedule, canWriteGrades, canViewSchedule } from '../../utils/auth';
import { NoAccess } from '../../components/ui/PermGuard';
import AdminScheduleView   from './AdminScheduleView';
import TeacherScheduleView from './TeacherScheduleView';
import StudentScheduleView from './StudentScheduleView';

export default function SchedulePage() {
  if (canManageSchedule()) return <AdminScheduleView/>;
  if (canWriteGrades())    return <TeacherScheduleView/>;
  if (canViewSchedule())   return <StudentScheduleView/>;
  return <NoAccess message="Нет доступа к расписанию"/>;
}
