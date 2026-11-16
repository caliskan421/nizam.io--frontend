// Önizleme testleri için gerçekçi `reportSeason` / `reportMeetingDetail` gövdeleri (şemaya uygun).
import {
  makeTaskPriorityDistribution,
  makeTaskStatusDistribution,
  withDateChangeDefaults,
  withMonthlyActivityDefaults,
  withReportNoteDefaults,
  withReportTaskDefaults,
  withSeasonDepartmentDefaults,
  withSeasonReportDefaults,
  withSeasonStatsDefaults,
} from '@/shared/api/__tests__/defaults'

import type { ReportMeetingDetail, SeasonReport } from '../model/types'

type Task = SeasonReport['tasks'][number]

const person = (id: string, name: string) => ({ account_id: id, full_name: name })

export const workloadRow = (
  over: Partial<SeasonReport['workload_summary'][number]>,
): SeasonReport['workload_summary'][number] => ({
  account_id: 'u0',
  active: 0,
  completed: 0,
  full_name: 'Ad Soyad',
  overdue: 0,
  pending_approval: 0,
  returned: 0,
  total: 0,
  ...over,
})

export function seasonTask(over: Partial<Task> = {}): Task {
  return withReportTaskDefaults({
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
    work_item_id: 'w1',
    ...over,
  })
}

const stat = (id: string, name: string, over: Record<string, unknown> = {}) =>
  withSeasonDepartmentDefaults({
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

const STATS = withSeasonStatsDefaults({
  agenda_checked: 162,
  agenda_total: 201,
  completed_tasks: 1,
  completion_rate: 33,
  overdue_tasks: 1,
  total_attachment_bytes: 432_642_458,
  total_attachments: 50,
  total_coordinators: 15,
  total_coordinatorships: 2,
  total_meetings: 41,
  total_members: 12,
  total_messages: 7,
  total_notes: 118,
  total_tasks: 3,
  total_users: 18,
})

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
    meetings: 11,
    messages: 20,
    month: '2026-06',
  },
].map(withMonthlyActivityDefaults)

const EMPTY_DEPARTMENT = {
  description: undefined,
  meeting_count: 0,
  total_tasks: 0,
  completed_tasks: 0,
  overdue_tasks: 0,
}

function seasonTasks(): Task[] {
  return [
    seasonTask({
      work_item_id: 'w1',
      priority: 'acil',
      is_overdue: true,
      days_overdue: 4,
      planned_end_on: '2026-09-30',
      code: 'ALT-7',
      sequence_no: 7,
      file_count: 2,
      file_bytes: 4_194_304,
      detail: {
        description: 'Ana panolardan stant adalarına kanal kazısı.',
        dependencies: [
          { code: 'ALT-3', status: 'tamamlandi', title: 'Atık su hattı', work_item_id: 'w9' },
        ],
        recent_notes: [
          {
            author: person('u1', 'Bahar Kılıç'),
            content: 'Kesişim çıktı; kazı durdu.',
            created_at: '2026-10-09T08:20:00Z',
          },
        ],
        date_requests: [
          {
            created_at: '2026-10-16T08:00:00Z',
            new_end_on: '2026-10-24',
            new_start_on: '2026-09-01',
            old_end_on: '2026-10-17',
            old_start_on: '2026-09-01',
            reason: 'taşeron gecikmesi',
            requested_by: person('u1', 'Bahar Kılıç'),
            review_reason: null,
            reviewed_at: null,
            reviewed_by: null,
            status: 'pending',
          },
        ],
      },
    }),
    seasonTask({
      work_item_id: 'w2',
      title: 'Hidrant hattı',
      status: 'tamamlandi',
      is_completed_late: true,
      days_late: 2,
      created_at: '2026-03-02T08:00:00Z',
      assignees: [],
      priority: 'yuksek',
    }),
    seasonTask({
      work_item_id: 'w3',
      title: 'Aydınlatma',
      status: 'iade_edildi',
      created_at: '2026-03-03T08:00:00Z',
    }),
  ]
}

const departments = () => [
  stat('d2', 'Operasyon', EMPTY_DEPARTMENT),
  stat('d1', 'Altyapı ve tesisat', {
    code: 'ALT',
    file_bytes: 4_194_304,
    file_count: 2,
    members: [person('u1', 'Bahar Kılıç'), person('u2', 'Kadir Özbek')],
  }),
]

const dateStats = () =>
  withDateChangeDefaults({
    approved: 5,
    average_shift_days: 4.2,
    pending: 3,
    rejected: 1,
    top_requested_tasks: [
      { code: 'ALT-7', count: 2, title: 'Kablo kanalı kazısı', work_item_id: 'w1' },
    ],
    total: 9,
  })

const seasonFiles = (): SeasonReport['files'] => [
  {
    created_at: '2026-10-12T09:00:00Z',
    department_id: 'd1',
    display_name: 'plan-v3.pdf',
    file_id: 'f1',
    size_bytes: 3_145_728,
    tag: 'Planlar',
    uploaded_by: person('u1', 'Bahar Kılıç'),
    work_item_id: 'w1',
  },
  {
    created_at: '2026-10-13T09:00:00Z',
    department_id: 'd1',
    display_name: 'IMG_1042.jpg',
    file_id: 'f2',
    size_bytes: 1_048_576,
    tag: null,
    uploaded_by: person('u2', 'Kadir Özbek'),
    work_item_id: 'w1',
  },
]

const seasonMeetings = (): SeasonReport['meetings'] => [
  {
    agenda_checked: 4,
    agenda_total: 6,
    converted_note_count: 1,
    coordinatorships: [
      { department_id: 'd1', name: 'Altyapı ve tesisat', deleted: false },
      { department_id: 'd2', name: 'Operasyon', deleted: true },
    ],
    meeting_date: '2026-10-14T11:00:00Z',
    meeting_id: 'm1',
    note_count: 5,
    owner_department_id: 'd1',
    participant_count: 5,
    title: 'Haftalık koordinasyon',
  },
]

export function seasonFixture(over: Partial<SeasonReport> = {}): SeasonReport {
  return withSeasonReportDefaults({
    coordinatorship_performance: departments(),
    date_change_stats: dateStats(),
    files: seasonFiles(),
    meetings: seasonMeetings(),
    period: { end_on: '2026-10-17', source: 'tasks', start_on: '2026-09-01' },
    program_year: 2026,
    generated_at: '2026-10-21T11:05:00Z',
    meeting_stats: {
      converted_to_task: 2,
      total_meetings: 41,
      total_notes: 118,
      total_participants: 90,
    },
    message_stats: { from_admins: 3, from_others: 4, total: 7 },
    monthly_activity: ACTIVITY,
    priority_distribution: makeTaskPriorityDistribution({ acil: 1, yuksek: 1, orta: 1 }),
    program_id: 'p1',
    program_name: 'Şanlıurfa Teknofest',
    stats: STATS,
    task_status_distribution: makeTaskStatusDistribution({
      devam_ediyor: 1,
      iade_edildi: 1,
      tamamlandi: 1,
    }),
    tasks: seasonTasks(),
    workload_summary: [
      workloadRow({
        account_id: 'u1',
        full_name: 'Bahar Kılıç',
        active: 4,
        overdue: 1,
        completed: 6,
        total: 10,
      }),
      workloadRow({
        account_id: 'u2',
        full_name: 'Kadir Özbek',
        active: 2,
        overdue: 0,
        completed: 3,
        total: 5,
      }),
    ],
    ...over,
  })
}

export function meetingFixture(over: Partial<ReportMeetingDetail> = {}): ReportMeetingDetail {
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
      meeting_id: 'm1',
      members_included: true,
      note_count: 2,
      owner_department_id: 'd1',
      participant_count: 2,
      participants: [person('u1', 'Bahar Kılıç'), person('u2', 'Kadir Özbek')],
      title: 'Haftalık koordinasyon toplantısı',
    },
    notes: [
      withReportNoteDefaults({
        author: person('u9', 'Ali Avcı'),
        author_role: 'admin',
        content: 'Kazı yüzde 60 tamamlandı.',
        converted_task_title: null,
        converted_to_task_id: null,
        created_at: '2026-10-14T11:05:00Z',
        note_id: 'n1',
      }),
      withReportNoteDefaults({
        author: person('u1', 'Bahar Kılıç'),
        author_role: 'member',
        content: 'Beton için ek ekip gerekli.',
        converted_task_code: 'ALT-7',
        converted_task_status: 'devam_ediyor',
        converted_task_title: 'Ek beton ekibi',
        converted_to_task_id: 't9',
        created_at: '2026-10-14T12:30:00Z',
        note_id: 'n2',
      }),
    ],
    participants: [
      { account_id: 'u1', full_name: 'Bahar Kılıç', role: 'member' },
      { account_id: 'u2', full_name: 'Kadir Özbek', role: 'member' },
    ],
    ...over,
  }
}
