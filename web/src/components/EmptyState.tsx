import { Icon } from './Icon';

export function EmptyState({
  title,
  hint,
  action,
  icon = 'inbox',
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  icon?: 'inbox' | 'shield' | 'alert';
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={34} />
      </div>
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  );
}
