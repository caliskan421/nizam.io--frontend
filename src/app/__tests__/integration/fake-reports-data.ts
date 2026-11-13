// W142 · O3: sahte rapor sunucusunun JSON gövdeleri (`reportSeason`, `reportMeetingDetail`; şemaya uygun,
// örnek veri — gerçek veri DEĞİL). Modül `__tests__` dizinine uzanmaz (sınır kuralı: app → modül yalnız public).
const person = (id: string, name: string) => ({ account_id: id, full_name: name })

const task = (id: string, over: Record<string, unknown> = {}) => ({
  assignees: [person('u1', 'Bahar Kılıç')],
  completed_on: null,
  created_at: '2026-03-01T08:00:00Z',
  created_by: person('u9', 'Ali Avcı'),
  days_early: 0,
  days_late: 0,
  days_overdue: 0,
  department_id: 'd1',
  department_name: 'Altyapı ve tesisat',
  dependency_count: 0,
  end_on: '2026-10-17',
  has_pending_dependency: false,
  is_completed_early: false,
  is_completed_late: false,
  is_overdue: false,
  note_count: 2,
  planned_end_on: null,
  priority: 'orta',
  start_on: '2026-09-01',
  status: 'devam_ediyor',
  title: 'Kablo kanalı kazısı',
  work_item_id: id,
  ...over,
})

const department = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  completed_tasks: 1,
  completion_rate: 50,
  coordinators: [person('c1', 'Abdullah Ateş')],
  department_id: id,
  description: 'Fuar alanı altyapısı',
  in_progress_tasks: 1,
  kind: 'koordinatorluk',
  last_activity_at: null,
  meeting_count: 4,
  member_count: 3,
  name,
  not_started_tasks: 0,
  overdue_tasks: 1,
  total_tasks: 2,
  ...over,
})

const STATS = {
  completed_tasks: 1,
  completion_rate: 33,
  overdue_tasks: 1,
  total_attachments: 50,
  total_coordinatorships: 2,
  total_meetings: 41,
  total_members: 12,
  total_messages: 7,
  total_notes: 118,
  total_tasks: 3,
  total_users: 18,
}

const ACTIVITY = [
  { completed_tasks: 4, count: 20, created_tasks: 6, meetings: 5, messages: 5, month: '2026-05' },
  {
    completed_tasks: 10,
    count: 61,
    created_tasks: 20,
    meetings: 11,
    messages: 20,
    month: '2026-06',
  },
]

const seasonTasks = () => [
  task('w1', { priority: 'acil', is_overdue: true, days_overdue: 4, planned_end_on: '2026-09-30' }),
  task('w2', {
    title: 'Hidrant hattı',
    status: 'tamamlandi',
    is_completed_late: true,
    days_late: 2,
    created_at: '2026-03-02T08:00:00Z',
    assignees: [],
    priority: 'yuksek',
  }),
  task('w3', { title: 'Aydınlatma', status: 'iade_edildi', created_at: '2026-03-03T08:00:00Z' }),
]

export function seasonBody(programId: string, programName: string) {
  return {
    coordinatorship_performance: [
      department('d2', 'Operasyon', { description: undefined, meeting_count: 0, total_tasks: 0 }),
      department('d1', 'Altyapı ve tesisat'),
    ],
    date_change_stats: { approved: 5, pending: 3, rejected: 1, total: 9 },
    generated_at: '2026-10-21T11:05:00Z',
    meeting_stats: {
      converted_to_task: 2,
      total_meetings: 41,
      total_notes: 118,
      total_participants: 90,
    },
    message_stats: { from_admins: 3, from_others: 4, total: 7 },
    monthly_activity: ACTIVITY,
    priority_distribution: { acil: 1, yuksek: 1, orta: 1, dusuk: 0 },
    program_id: programId,
    program_name: programName,
    stats: STATS,
    task_status_distribution: {
      baslanmadi: 0,
      devam_ediyor: 1,
      onaya_sunuldu: 0,
      iade_edildi: 1,
      tamamlandi: 1,
    },
    tasks: seasonTasks(),
  }
}

export function meetingBody(meetingId: string, title: string) {
  return {
    agenda: [
      { title: 'Kablo kanalı kazı ilerlemesi', is_checked: true },
      { title: 'Jeneratör sahası beton tarihi', is_checked: false },
    ],
    meeting: {
      coordinatorships: [
        { department_id: 'd2', name: 'Elektrik ve enerji', deleted: true },
        { department_id: 'd1', name: 'Altyapı ve tesisat', deleted: false },
      ],
      created_by: person('u9', 'Ali Avcı'),
      created_by_role: 'admin',
      meeting_date: '2026-10-14T11:00:00Z',
      meeting_id: meetingId,
      members_included: true,
      note_count: 2,
      owner_department_id: 'd1',
      participant_count: 2,
      participants: [person('u1', 'Bahar Kılıç'), person('u2', 'Kadir Özbek')],
      title,
    },
    notes: [
      {
        author: person('u9', 'Ali Avcı'),
        author_role: 'admin',
        content: 'Kazı yüzde 60 tamamlandı.',
        converted_task_title: null,
        converted_to_task_id: null,
        created_at: '2026-10-14T11:05:00Z',
        note_id: 'n1',
      },
      {
        author: person('u1', 'Bahar Kılıç'),
        author_role: 'member',
        content: 'Beton için ek ekip gerekli.',
        converted_task_title: 'Ek beton ekibi',
        converted_to_task_id: 't9',
        created_at: '2026-10-14T12:30:00Z',
        note_id: 'n2',
      },
    ],
    participants: [
      { account_id: 'u1', full_name: 'Bahar Kılıç', role: 'member' },
      { account_id: 'u2', full_name: 'Kadir Özbek', role: 'member' },
    ],
  }
}
