import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Ticket, TicketThreadResponse, TicketsResponse } from '../api/types';
import { useApi } from '../lib/useApi';
import { formatDateTime } from '../lib/format';
import { DataTable, type Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

interface CreateFormState {
  subject: string;
  message: string;
}

export default function Support() {
  const list = useApi<TicketsResponse>(() => api.get<TicketsResponse>('/tickets'), []);
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateFormState>({ subject: '', message: '' });
  const [formErrors, setFormErrors] = useState<Partial<CreateFormState>>({});
  const [creating, setCreating] = useState(false);

  const thread = useApi<TicketThreadResponse | null>(
    () => (selectedId ? api.get<TicketThreadResponse>(`/tickets/${selectedId}`) : Promise.resolve(null)),
    [selectedId],
  );

  const openThread = (ticket: Ticket) => {
    setShowForm(false);
    setSelectedId(ticket.id);
  };

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    const subject = form.subject.trim();
    const message = form.message.trim();
    const errors: Partial<CreateFormState> = {};
    if (subject.length < 3 || subject.length > 140) {
      errors.subject = 'Subject must be 3–140 characters';
    }
    if (message.length < 1 || message.length > 4000) {
      errors.message = 'Message must be 1–4000 characters';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCreating(true);
    try {
      const res = await api.post<{ ticket: { id: string } }>('/tickets', { subject, message });
      toast('Ticket created — our team will reply by email and here.', 'success');
      setForm({ subject: '', message: '' });
      setShowForm(false);
      await list.retry();
      setSelectedId(res.ticket.id);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not create ticket.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'subject',
      header: 'Subject',
      render: (t) => (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ border: 'none', paddingLeft: 0, fontWeight: 600 }}
          onClick={() => openThread(t)}
          aria-label={`Open ticket: ${t.subject}`}
        >
          {t.subject}
        </button>
      ),
    },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'created_at',
      header: 'Created',
      hideOn: 'sm',
      render: (t) => formatDateTime(t.created_at),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      hideOn: 'sm',
      render: (t) => formatDateTime(t.updated_at),
    },
  ];

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load your tickets" error={list.error} retry={list.retry} />;
  }

  const tickets = list.data?.tickets ?? [];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Support</h1>
          <p>Open a ticket and follow the conversation. Replies appear here and in your notifications.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSelectedId(null);
            setShowForm((v) => !v);
          }}
        >
          {showForm ? 'Close form' : 'New ticket'}
        </button>
      </div>

      {showForm ? (
        <form className="card" onSubmit={(e) => void submitTicket(e)} noValidate aria-label="Create ticket">
          <h2>New support ticket</h2>
          <div className="field">
            <label htmlFor="ticket-subject">Subject</label>
            <input
              id="ticket-subject"
              className="input"
              type="text"
              value={form.subject}
              maxLength={140}
              aria-invalid={formErrors.subject ? true : undefined}
              aria-describedby={formErrors.subject ? 'ticket-subject-error' : undefined}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Brief summary of the problem"
            />
            {formErrors.subject ? (
              <span id="ticket-subject-error" className="field-error">
                {formErrors.subject}
              </span>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="ticket-message">Message</label>
            <textarea
              id="ticket-message"
              className="input"
              value={form.message}
              maxLength={4000}
              aria-invalid={formErrors.message ? true : undefined}
              aria-describedby={formErrors.message ? 'ticket-message-error' : undefined}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Describe what happened, including device, server and time."
            />
            {formErrors.message ? (
              <span id="ticket-message-error" className="field-error">
                {formErrors.message}
              </span>
            ) : null}
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create ticket'}
          </button>
        </form>
      ) : null}

      {selectedId ? (
        <div className="card" aria-label="Ticket thread">
          {thread.loading && !thread.data ? (
            <p className="muted">Loading conversation…</p>
          ) : thread.error || !thread.data ? (
            <ErrorState
              title="Could not load the conversation"
              error={thread.error}
              retry={() => void thread.retry()}
            />
          ) : (
            <>
              <div className="row-between" style={{ marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>{thread.data.ticket.subject}</h2>
                <StatusBadge status={thread.data.ticket.status} />
              </div>
              <div className="stack" style={{ gap: 12 }}>
                {thread.data.messages.map((m) => {
                  const mine = m.author_id === thread.data?.ticket.user_id;
                  return (
                    <div
                      key={m.id}
                      className="card"
                      style={{
                        background: 'var(--surface-2)',
                        padding: 14,
                      }}
                    >
                      <div className="row-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{mine ? 'You' : 'Support'}</span>
                        <span className="small muted">{formatDateTime(m.created_at)}</span>
                      </div>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.body}</p>
                    </div>
                  );
                })}
              </div>
              <p className="small muted" style={{ marginTop: 12 }}>
                To add more information, open a follow-up ticket — replies from the team arrive by
                email and as notifications.
              </p>
            </>
          )}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={tickets}
        rowKey={(t) => t.id}
        caption="Your support tickets"
        empty={
          <EmptyState
            title="No tickets"
            hint="When something goes wrong, open a ticket and the team will help."
          />
        }
      />
    </div>
  );
}
