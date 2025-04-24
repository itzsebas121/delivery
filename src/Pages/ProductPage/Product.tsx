import './index.css';
import { useState, useEffect } from 'react';
import { baseURLRest } from '../../config';
import ProductCard from '../../components/ProductCard';

const Product = () => {
  // Estado para los productos y filtros
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(8);
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
  };

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryFilter(e.target.value);
  };

  return (
    <div>
      <h1>Productos</h1>

      {/* Filtros */}
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={nameFilter}
          onChange={handleNameFilterChange}
        />
        <input
          type="text"
          placeholder="Buscar por categoría"
          value={categoryFilter}
          onChange={handleCategoryFilterChange}
        />
      </div>

      {/* Productos */}
      <div className="product-list">
        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          products.map((product: any) => (
            <ProductCard
              key={product.ProductId}
              productId={product.ProductId}
              productName={product.ProductName}
              description={product.Description}
              price={product.Price}
              stock={product.Stock}
              imageURL={product.ImageURL}
              categoryName={product.CategoryName}
            />
          ))
        )}
      </div>

      {/* Paginación */}
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={page === 1}>
          Anterior
        </button>
        <span>Página {page}</span>
        <button onClick={handleNextPage}>Siguiente</button>
      </div>
    </div>
  );
};

export default Product;
