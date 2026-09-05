import { ApiError } from '../api/client';
import { Icon } from './Icon';

export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0 || error.code === 'NETWORK_ERROR') {
      return 'You appear to be offline or the server is unreachable. Check your connection and retry.';
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Unexpected error. Please retry.';
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  retry,
}: {
  title?: string;
  error?: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <div className="empty-icon">
        <Icon name="alert" size={34} />
      </div>
      <h3>{title}</h3>
      <p>{errorText(error)}</p>
      {retry ? (
        <button type="button" className="btn btn-ghost" onClick={retry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
