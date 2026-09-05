import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

export default function NotFound() {
  return (
    <div className="empty" style={{ paddingTop: 80 }}>
      <div className="empty-icon">
        <Icon name="shield" size={40} />
      </div>
      <h1 style={{ fontSize: 44, marginBottom: 0 }}>404</h1>
      <p>This page does not exist in the AegisVPN control plane.</p>
      <Link className="btn btn-primary" to="/">
        Back to dashboard
      </Link>
    </div>
  );
}
