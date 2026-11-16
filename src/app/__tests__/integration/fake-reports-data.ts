// W142 · O3: sahte rapor sunucusunun JSON gövdeleri (`reportSeason`, `reportMeetingDetail`; şemaya uygun,
// örnek veri — gerçek veri DEĞİL). Modül `__tests__` dizinine uzanmaz (sınır kuralı: app → modül yalnız public).
const person = (id: string, name: string) => ({ account_id: id, full_name: name })

const task = (id: string, over: Record<string, unknown> = {}) => ({
  assignees: [person('u1', 'Bahar Kılıç')],
  code: null,
  completed_on: null,
  created_at: '2026-03-01T08:00:00Z',
  created_by: person('u9', 'Ali Avcı'),
  days_early: 0,
  days_late: 0,
  days_overdue: 0,
  department_id: 'd1',
  department_name: 'Altyapı ve tesisat',
  dependency_count: 0,
  detail: null,
  end_on: '2026-10-17',
  file_bytes: 0,
  file_count: 0,
  has_pending_dependency: false,
  is_completed_early: false,
  is_completed_late: false,
  is_overdue: false,
  note_count: 2,
  planned_end_on: null,
  priority: 'orta',
  sequence_no: null,
  start_on: '2026-09-01',
  status: 'devam_ediyor',
  title: 'Kablo kanalı kazısı',
  work_item_id: id,
  ...over,
})

const department = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  code: null,
  completed_tasks: 1,
  completion_rate: 50,
  coordinators: [person('c1', 'Abdullah Ateş')],
  department_id: id,
  description: 'Fuar alanı altyapısı',
  file_bytes: 0,
  file_count: 0,
  in_progress_tasks: 1,
  kind: 'koordinatorluk',
  last_activity_at: null,
  late_completed_tasks: 0,
  meeting_count: 4,
  member_count: 3,
  members: [],
  name,
  not_started_tasks: 0,
  overdue_tasks: 1,
  pending_approval_tasks: 0,
  returned_tasks: 0,
  total_tasks: 2,
  ...over,
})

const STATS = {
  agenda_checked: 0,
  agenda_total: 0,
  completed_tasks: 1,
  completion_rate: 33,
  early_completed_tasks: 0,
  late_completed_tasks: 1,
  overdue_tasks: 1,
  total_admins: 1,
  total_attachment_bytes: 0,
  total_attachments: 50,
  total_coordinators: 2,
  total_coordinatorships: 2,
  total_meeting_notes: 118,
  total_meetings: 41,
  total_members: 12,
  total_messages: 7,
  total_notes: 118,
  total_tasks: 3,
  total_users: 18,
}

const ACTIVITY = [
  {
    completed_tasks: 4,
    count: 20,
    created_tasks: 6,
    date_requests: 1,
    files: 3,
    meetings: 5,
    messages: 5,
    month: '2026-05',
    notes: 9,
  },
  {
    completed_tasks: 10,
    count: 61,
    created_tasks: 20,
    date_requests: 2,
    files: 7,
    meetings: 11,
    messages: 20,
    month: '2026-06',
    notes: 14,
  },
]

const seasonTasks = () => [
  task('w1', {
    priority: 'acil',
    is_overdue: true,
    days_overdue: 4,
    planned_end_on: '2026-09-30',
    code: 'ALT-7',
    sequence_no: 7,
    file_count: 1,
    file_bytes: 3_984_588,
    detail: {
      date_requests: [
        {
          created_at: '2026-10-16T08:00:00Z',
          new_end_on: '2026-10-24',
          new_start_on: '2026-09-01',
          old_end_on: '2026-10-17',
          old_start_on: '2026-09-01',
          reason: 'taşeron ekip gecikmesi',
          requested_by: person('u1', 'Bahar Kılıç'),
          review_reason: null,
          reviewed_at: null,
          reviewed_by: null,
          status: 'pending',
        },
      ],
      dependencies: [
        { code: 'ALT-3', status: 'tamamlandi', title: 'Atık su hattı', work_item_id: 'w9' },
      ],
      description: 'Ana dağıtım panolarından stant adalarına kablo kanalı kazısı.',
      recent_notes: [
        {
          author: person('u1', 'Bahar Kılıç'),
          content: 'C salonu önünde kesişim çıktı; kazı durdu.',
          created_at: '2026-10-09T08:20:00Z',
        },
      ],
    },
  }),
  task('w2', {
    title: 'Hidrant hattı',
    status: 'tamamlandi',
    is_completed_late: true,
    days_late: 2,
    created_at: '2026-03-02T08:00:00Z',
    assignees: [],
    priority: 'yuksek',
    code: 'ALT-2',
    sequence_no: 2,
  }),
  task('w3', {
    title: 'Aydınlatma',
    status: 'iade_edildi',
    created_at: '2026-03-03T08:00:00Z',
    code: null,
    sequence_no: 3,
  }),
]

const DEPARTMENTS = () => [
  department('d2', 'Operasyon', { description: undefined, meeting_count: 0, total_tasks: 0 }),
  department('d1', 'Altyapı ve tesisat', {
    code: 'ALT',
    file_bytes: 3_984_588,
    file_count: 1,
    late_completed_tasks: 1,
    members: [person('u1', 'Bahar Kılıç'), person('u2', 'Kadir Özbek')],
  }),
]

const DATE_STATS = {
  approved: 5,
  average_shift_days: 4.2,
  pending: 3,
  rejected: 1,
  top_requested_tasks: [
    { code: 'ALT-7', count: 2, title: 'Kablo kanalı kazısı', work_item_id: 'w1' },
  ],
  total: 9,
}

const FILES = [
  {
    created_at: '2026-10-12T09:00:00Z',
    department_id: 'd1',
    display_name: 'saha-kablo-kanali-plan-v3.pdf',
    file_id: 'f1',
    size_bytes: 3_984_588,
    tag: 'Planlar',
    uploaded_by: person('u1', 'Bahar Kılıç'),
    work_item_id: 'w1',
  },
]

const MEETINGS = [
  {
    agenda_checked: 4,
    agenda_total: 6,
    converted_note_count: 1,
    coordinatorships: [{ department_id: 'd1', name: 'Altyapı ve tesisat', deleted: false }],
    meeting_date: '2026-10-14T11:00:00Z',
    meeting_id: 'm1',
    note_count: 5,
    owner_department_id: 'd1',
    participant_count: 5,
    title: 'Haftalık koordinasyon toplantısı',
  },
]

const WORKLOAD = [
  {
    account_id: 'u1',
    active: 1,
    completed: 0,
    full_name: 'Bahar Kılıç',
    overdue: 1,
    pending_approval: 0,
    returned: 0,
    total: 1,
  },
  {
    account_id: 'u2',
    active: 1,
    completed: 1,
    full_name: 'Kadir Özbek',
    overdue: 0,
    pending_approval: 0,
    returned: 1,
    total: 2,
  },
]

/** Sözleşme tavanındaki büyük dönem (BE-132): 5000 görev satırı + 2000 dosya satırı, kesilmemiş. */
export function largeSeasonBody(programId: string, programName: string) {
  const base = seasonBody(programId, programName)
  const statuses = ['baslanmadi', 'devam_ediyor', 'onaya_sunuldu', 'iade_edildi', 'tamamlandi']
  const priorities = ['acil', 'yuksek', 'orta', 'dusuk']
  const tasks = Array.from({ length: 5000 }, (_, i) => {
    const day = String((i % 28) + 1).padStart(2, '0')
    return task(`wl${i}`, {
      code: `ALT-${i + 1}`,
      sequence_no: i + 1,
      title: `Büyük dönem görevi ${i + 1}`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      department_id: i % 2 === 0 ? 'd1' : 'd2',
      start_on: `2026-09-${day}`,
      end_on: `2026-10-${day}`,
      is_overdue: i % 7 === 0,
      days_overdue: i % 7 === 0 ? 3 : 0,
      file_count: i % 3 === 0 ? 1 : 0,
    })
  })
  const files = Array.from({ length: 2000 }, (_, i) => ({
    ...FILES[0]!,
    file_id: `fl${i}`,
    work_item_id: `wl${i % 5000}`,
    display_name: `dosya-${i + 1}.pdf`,
  }))
  return {
    ...base,
    tasks,
    files,
    limits: {
      files_returned: 2000,
      files_total: 2000,
      notes_per_task: 5,
      tasks_returned: 5000,
      tasks_total: 5000,
    },
  }
}

export function seasonBody(programId: string, programName: string) {
  const tasks = seasonTasks()
  return {
    coordinatorship_performance: DEPARTMENTS(),
    date_change_stats: DATE_STATS,
    files: FILES,
    generated_at: '2026-10-21T11:05:00Z',
    limits: {
      files_returned: 1,
      files_total: 1,
      notes_per_task: 5,
      tasks_returned: 3,
      tasks_total: 3,
    },
    meeting_stats: {
      converted_to_task: 2,
      total_meetings: 41,
      total_notes: 118,
      total_participants: 90,
    },
    meetings: MEETINGS,
    message_stats: { from_admins: 3, from_others: 4, total: 7 },
    monthly_activity: ACTIVITY,
    period: { end_on: '2026-10-17', source: 'tasks', start_on: '2026-09-01' },
    priority_distribution: { acil: 1, yuksek: 1, orta: 1, dusuk: 0 },
    program_id: programId,
    program_name: programName,
    program_year: 2026,
    stats: STATS,
    task_status_distribution: {
      baslanmadi: 0,
      devam_ediyor: 1,
      onaya_sunuldu: 0,
      iade_edildi: 1,
      tamamlandi: 1,
    },
    tasks,
    workload_summary: WORKLOAD,
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
        converted_task_code: null,
        converted_task_status: null,
        converted_task_title: null,
        converted_to_task_id: null,
        created_at: '2026-10-14T11:05:00Z',
        note_id: 'n1',
      },
      {
        author: person('u1', 'Bahar Kılıç'),
        author_role: 'member',
        content: 'Beton için ek ekip gerekli.',
        converted_task_code: 'ALT-7',
        converted_task_status: 'devam_ediyor',
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
