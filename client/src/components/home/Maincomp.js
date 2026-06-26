import React, { useEffect, useState, useMemo } from 'react';
import Banner from './Banner';
import "./home.css";
import Slide from './Slide';
import { getProducts } from '../redux/actions/action';
import { useDispatch, useSelector } from "react-redux";
import { CircularProgress } from '@mui/material'; // Import CircularProgress for loading

const Maincomp = () => {
    const { products } = useSelector(state => state.getProductsdata);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getProducts());
    }, [dispatch]);

    useEffect(() => {
        if (products && products.length > 0) {
            try {
                const viewedIds = JSON.parse(localStorage.getItem('viewedProducts')) || [];
                const recommendations = products.filter(product => !viewedIds.includes(product.id));
                setRecommendedProducts(recommendations);
            } catch (error) {
                console.error("Failed to process recommendations:", error);
            }
        }
    }, [products]);

    const bestSellers = useMemo(() => {
        if (!products) return [];
        return products.filter((product) => product.tagline === 'Best Seller' || product.tagline === 'Top Rated');
    }, [products]);

    const highDiscounts = useMemo(() => {
        if (!products) return [];
        return products.filter((product) => parseInt(product.price.discount) >= 50);
    }, [products]);
    

    return (
        <div className='home_section'>
            <div className='banner_part'>
                <Banner />
            </div>

            {/* --- THIS IS THE FIX --- */}
            {/* We only render the carousels if the products array is not empty */}
            {products && products.length > 0 ? (
                <>
                    <div className='slide_part'>
                        <div className='left_slide'>
                            {/* Corrected title and prop */}
                            <Slide title="Deal of the Day" products={products} />
                        </div>
                        <div className='right_slide'>
                            <h4>Festive latest launcher</h4>
                            <img src="https://images-eu.ssl-images-amazon.com/images/G/31/img21/Wireless/Jupiter/Launches/T3/DesktopGateway_CategoryCard2x_758X608_T3._SY608_CB639883570_.jpg" alt="rightimg" />
                            <a href="#">See More</a>
                        </div>
                    </div>

                    {recommendedProducts.length > 0 && (
                        <Slide title="Recommended for You" products={recommendedProducts} />
                    )}
                    
                    <div className='center_img'>
                        <img src="https://m.media-amazon.com/images/G/31/AMS/IN/970X250-_desktop_banner.jpg" alt="" />
                    </div>
                    
                    {/* Corrected title and prop */}
                    <Slide title="Best Seller" products={bestSellers} />
                    
                    <Slide title="Big Discounts" products={highDiscounts} />
                </>
            ) : (
                // Show a loading spinner while products are being fetched
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <CircularProgress />
                    <h2>Loading Products...</h2>
                </div>
            )}
        </div>
    );
}

export default Maincomp;