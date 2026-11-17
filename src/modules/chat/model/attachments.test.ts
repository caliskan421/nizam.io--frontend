import { describe, expect, it } from 'vitest'

import {
  ATTACHMENT_EXTENSIONS,
  attachmentBody,
  buildArchiveForm,
  buildAttachmentForm,
  hasAllowedExtension,
} from './attachments'

const file = (name: string) => new File(['x'], name, { type: 'application/octet-stream' })
const input = (over: Partial<Parameters<typeof buildAttachmentForm>[0]> = {}) => ({
  programId: 'p1',
  chatId: 'c1',
  clientMessageId: 'cm-1',
  file: file('rapor.pdf'),
  ...over,
})

describe('ek yükleme gövdesi', () => {
  it('açıklama (body) dosyadan ÖNCE; dosya adı korunur', () => {
    const form = buildAttachmentForm(input({ caption: 'Bakın' }))
    expect([...form.keys()]).toEqual(['body', 'file'])
    expect((form.get('file') as File).name).toBe('rapor.pdf')
    expect(form.get('body')).toBe('Bakın')
  })

  it('açıklama yoksa yalnız dosya parçası (ek mesajında body boş olabilir)', () => {
    expect([...buildAttachmentForm(input()).keys()]).toEqual(['file'])
    expect(attachmentBody(input())).toBeInstanceOf(FormData)
  })

  it('izinli 11 tür; video yok', () => {
    expect(ATTACHMENT_EXTENSIONS).toHaveLength(11)
    for (const name of ['a.PDF', 'b.docx', 'c.pages', 'd.csv', 'e.jpg', 'f.png', 'g.pptx']) {
      expect(hasAllowedExtension(name), name).toBe(true)
    }
    for (const name of ['v.mp4', 'h.heic', 'x', 'y.exe', '.pdf.zip']) {
      expect(hasAllowedExtension(name), name).toBe(false)
    }
  })
})

describe('archiveChatFile gövdesi (BE-029)', () => {
  const file = new File(['x'], 'plan.pdf', { type: 'application/pdf' })
  const base = {
    programId: 'p1',
    chatId: 'c1',
    clientMessageId: 'cm-1',
    workItemId: 'w1',
    tag: 'plan',
    file,
  }

  it("metin alanları file'dan ÖNCE, file SON parça; boş alanlar gönderilmez", () => {
    expect([...buildArchiveForm(base).keys()]).toEqual([
      'client_message_id',
      'work_item_id',
      'tag',
      'file',
    ])
    const full = buildArchiveForm({
      ...base,
      subtaskId: 's1',
      body: 'Bakın',
      replyToMessageId: 'm0',
    })
    expect([...full.keys()]).toEqual([
      'client_message_id',
      'work_item_id',
      'tag',
      'subtask_id',
      'body',
      'reply_to_message_id',
      'file',
    ])
    expect(full.get('client_message_id')).toBe('cm-1')
    expect((full.get('file') as File).name).toBe('plan.pdf')
  })
})
