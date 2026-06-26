import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ViewAll.css'; // We'll create this file for styling

const ViewAll = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const getProducts = async () => {
        try {
            // Fetching data from your backend API
            const res = await fetch("/getproducts", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await res.json();
            setProducts(data);
            setLoading(false); // Set loading to false after data is fetched
        } catch (error) {
            console.log("Error fetching all products:", error);
            setLoading(false); // Also set loading to false on error
        }
    }

    useEffect(() => {
        getProducts();
    }, []);

    // Display a loading message while fetching data
    if (loading) {
        return <div className="loading"><h1>Loading All Products...</h1></div>;
    }

    return (
        <div className="view-all-container">
            <h1>All Products</h1>
            <div className="products-grid">
                {products.map((e) => (
                    // Link each card to its individual product page
                    <Link to={`/getproductsone/${e.id}`} className="product-card-link" key={e.id}>
                        <div className="product-card">
                            <div className="product-image-container">
                                 <img src={e.url} alt={e.title.shortTitle} />
                            </div>
                            <h3>{e.title.shortTitle}</h3>
                            <p className="product-price">₹{e.price.cost}</p>
                            <p className="product-tagline">{e.title.longTitle}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ViewAll;