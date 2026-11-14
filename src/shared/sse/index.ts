// `shared/sse` dışa açık yüzü: gerçek zamanlı akışın TEK girişi (KESİN 34).
export { openEventStream, type OpenEventStreamOptions } from './open-event-stream'
export type { CoalescedEvent, StreamEvent } from './coalesce'
export type { CloseReason, StreamState } from './connection'
export type { StreamPath, StreamTransport, OpenResult } from './transport'
export { reconnectDelay } from './backoff'
