import './Skeleton.css';

const Skeleton = ({ variant = 'product', count = 1 }) => {
  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className={`skeleton skeleton-${variant}`}>
          {variant === 'product' && (
            <>
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
                <div className="skeleton-price"></div>
              </div>
            </>
          )}
          {variant === 'text' && <div className="skeleton-text"></div>}
          {variant === 'card' && (
            <>
              <div className="skeleton-image"></div>
              <div className="skeleton-title"></div>
            </>
          )}
        </div>
      ))}
    </>
  );
};

export default Skeleton;
