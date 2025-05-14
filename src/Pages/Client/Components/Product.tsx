import './index.css';
import { useState, useEffect } from 'react';
import { baseURLRest } from '../../../config';
import ProductCard from '../../../components/ProductCard';

const Product = () => {
  // Estado para los productos y filtros
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(8);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Fetch productos con paginación y filtros
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          name: nameFilter,
          category: categoryFilter,
        }).toString();

        const response = await fetch(`${baseURLRest}/products?${query}`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, limit, nameFilter, categoryFilter]);

  // Controlar la paginación
  const handleNextPage = () => {
    setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Controlar los filtros
  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameFilter(e.target.value);
    setPage(1); 
  };

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryFilter(e.target.value);
    setPage(1); 
  };

  return (
    <div className="product-container">
      <div className="product-header">
        <h1 className="product-title">Productos</h1>
        
        {/* Filtros */}
        <div className="product-filters">
          <div className="product-search">
            <span className="product-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={nameFilter}
              onChange={handleNameFilterChange}
              className="product-input"
            />
          </div>
          <div className="product-search">
            <span className="product-search-icon">📂</span>
            <input
              type="text"
              placeholder="Buscar por categoría"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="product-input"
            />
          </div>
        </div>
      </div>

      {/* Productos */}
      {loading ? (
        <div className="product-loading">
          <div className="product-loader"></div>
          <p>Cargando productos...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="product-grid">
          {products.map((product: any) => (
            <div className="product-card-wrapper" key={product.ProductId}>
              <ProductCard
                productId={product.ProductId}
                productName={product.ProductName}
                description={product.Description}
                price={product.Price}
                stock={product.Stock}
                imageURL={product.ImageURL}
                categoryName={product.CategoryName}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="product-empty">
          <p>No se encontraron productos con los filtros seleccionados.</p>
        </div>
      )}

      {/* Paginación */}
      <div className="product-pagination">
        <button 
          className="product-pagination-btn" 
          onClick={handlePrevPage} 
          disabled={page === 1}
        >
          ← 
        </button>
        <span className="product-pagination-info">{page}</span>
        <button 
          className="product-pagination-btn" 
          onClick={handleNextPage}
          disabled={products.length < limit}
        >
           →
        </button>
      </div>
    </div>
  );
};

export default Product;
