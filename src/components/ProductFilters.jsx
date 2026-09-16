import './ProductFilters.css';

const ProductFilters = ({ 
  sortBy, 
  onSortChange, 
  minPrice, 
  maxPrice, 
  onPriceChange,
  expanded,
  onToggle
}) => {
  return (
    <div className="product-filters">
      <div className="filters-header" onClick={onToggle}>
        <h3>🔍 Filtros y Ordenamiento</h3>
        <span className={`toggle-icon ${expanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {expanded && (
        <div className="filters-content">
          {/* Ordenamiento */}
          <div className="filter-group">
            <label htmlFor="sort">Ordenar por:</label>
            <select 
              id="sort"
              value={sortBy} 
              onChange={(e) => onSortChange(e.target.value)}
              className="filter-select"
            >
              <option value="default">Relevancia</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="newest">Más Nuevos</option>
              <option value="rating">Mejor Calificado</option>
            </select>
          </div>

          {/* Rango de Precio */}
          <div className="filter-group">
            <label>Rango de Precio:</label>
            <div className="price-range">
              <div className="price-input">
                <label htmlFor="minPrice">Min:</label>
                <input
                  id="minPrice"
                  type="number"
                  value={minPrice}
                  onChange={(e) => onPriceChange(parseInt(e.target.value) || 0, maxPrice)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <span className="price-separator">-</span>
              <div className="price-input">
                <label htmlFor="maxPrice">Max:</label>
                <input
                  id="maxPrice"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => onPriceChange(minPrice, parseInt(e.target.value) || 10000)}
                  placeholder="10000"
                  max="10000"
                />
              </div>
            </div>
            <div className="price-display">
              ${minPrice} - ${maxPrice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
