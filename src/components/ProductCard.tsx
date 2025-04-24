import './index.css';
import React, { useState } from 'react';

interface ProductCardProps {
    productId: number;
    productName: string;
    description: string;
    price: number;
    stock: number;
    imageURL: string;
    categoryName: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
    productName,
    description,
    price,
    stock,
    imageURL,
    categoryName,
}) => {
    const [hasError, setHasError] = useState(false);

    return (
        <div className="product-card">
            {hasError ? (
                <div className="image-fallback">
                    <span className="fallback-icon">🍽️</span>
                    <div className="fallback-text">Imagen no disponible</div>
                </div>
            ) : (
                <img
                    src={imageURL}
                    alt={productName}
                    className="product-image"
                    onError={() => setHasError(true)}
                />
            )}

            <div className="product-info">
                <div className="category">{categoryName}</div>
                <h3 className="product-title">{productName}</h3>
                <p className="description">{description}</p>
                <div className="price">${price.toFixed(2)}</div>
                <div className="stock">{stock} unidades disponibles</div>
                <button className="buy-button">Comprar ahora</button>
            </div>
        </div>
    );
}
export default ProductCard;
