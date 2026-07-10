import { Link } from 'react-router-dom';
import './Breadcrumb.css';

const Breadcrumb = ({ items = [] }) => {
  if (items.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/">
            <span className="breadcrumb-icon">🏠</span>
            Inicio
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {item.url ? (
              <Link to={item.url}>{item.label}</Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
