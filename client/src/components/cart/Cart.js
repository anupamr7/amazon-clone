import "./cart.css";
import { Divider } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useContext, useEffect, useState } from 'react';
import { LoginContext } from "../context/ContextProvider";
import CircularProgress from '@mui/material/CircularProgress';
// --- 1. IMPORT TOAST ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// A simple component to display star ratings
const StarRating = ({ rating }) => {
    // ... (Your existing StarRating component)
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars.push(<span key={i} className="star filled">★</span>);
        } else {
            stars.push(<span key={i} className="star">☆</span>);
        }
    }
    return <div className="star-rating">{stars}</div>;
};


const Cart = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { account, setAccount } = useContext(LoginContext);

    const [inddata, setInddata] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [reviewStatus, setReviewStatus] = useState("");

    const getinddata = async () => {
        setIsLoading(true); 
        try {
            const res = await fetch(`/getproductsone/${id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            setInddata(data);

        } catch (error) {
            console.error("Failed to fetch product:", error);
            setInddata(null); 
        } finally {
            setIsLoading(false); 
        }
    }

    useEffect(() => {
        setReviewStatus(""); 
        getinddata();

        try {
            const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts')) || [];
            if (id && !viewedProducts.includes(id)) {
                viewedProducts.push(id);
                const updatedViewed = viewedProducts.slice(-5);
                localStorage.setItem('viewedProducts', JSON.stringify(updatedViewed));
            }
        } catch (error) {
            console.error("Failed to update viewed products in localStorage:", error);
        }
    }, [id]);

    // --- UPDATED addtocart FUNCTION ---
    const addtocart = async () => {
        if (!account) {
            toast.warn("Please sign in to add items to your cart.", { position: "top-center" });
            navigate('/login');
            return false;
        }
        const res = await fetch(`/addcart/${id}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            credentials: "include"
        });
        const data1 = await res.json();
        if (res.status === 401 || !data1) {
            toast.error("Session expired or user invalid. Please log in.", { position: "top-center" });
            return false;
        } else {
            // --- 2. ADD SUCCESS TOAST ---
            toast.success("Product added to cart!", { position: "top-center" });
            setAccount(data1);
            return true;
        }
    };
    
    // --- THIS IS YOUR CORRECT "BUY NOW" FUNCTION ---
    const buyNowHandler = async () => {
        const success = await addtocart(); // Adds to cart
        if (success) {
            navigate("/checkout"); // Navigates to checkout
        }
    };
    
    const submitReviewHandler = async (e) => {
        e.preventDefault();
        setReviewStatus("Submitting...");

        try {
            const res = await fetch(`/products/${id}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ rating, comment })
            });

            const data = await res.json();

            if (res.status === 201) {
                setReviewStatus("Review submitted successfully!");
                toast.success("Review submitted!", { position: "top-center" });
                setRating(0);
                setComment("");
                getinddata(); 
            } else {
                setReviewStatus(`Error: ${data.message || 'Could not submit review.'}`);
                toast.error(`Error: ${data.message || 'Could not submit review.'}`, { position: "top-center" });
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            setReviewStatus("Error: Could not submit review.");
            toast.error("Error: Could not submit review.", { position: "top-center" });
        }
    };
    

    return (
        <div className='cart_section'>
            {/* --- 3. ADD TOASTCONTAINER --- */}
            <ToastContainer />
            
            {isLoading ? (
                <div className='circle'>
                    <CircularProgress />
                    <h2>Loading....</h2>
                </div>
            ) : inddata ? (
                <>
                    <div className='cart_container'>
                        <div className='left_cart'>
                            <img src={inddata.url} alt="cart_img" />
                            <div className='cart_btn'>
                                <button className='cart_btn1' onClick={addtocart}>Add to Cart</button> 
                                <button className='cart_btn2' onClick={buyNowHandler}>Buy Now</button> 
                            </div>
                        </div>
                        <div className="right_cart">
                            <h3>{inddata.title.shortTitle}</h3>
                            <h4>{inddata.title.longTitle}</h4>
                            <Divider />
                            <p className="mrp">M.R.P. : <del>₹{inddata.price.mrp}</del></p>
                            <p>Deal of the Day : <span style={{ color: "#B12704" }}>₹{inddata.price.cost}.00</span></p>
                            <p>You save : <span style={{ color: "#B12704" }}> ₹{inddata.price.mrp - inddata.price.cost} ({inddata.price.discount}) </span></p>

                            <div className="discount_box">
                                <h5 >Discount : <span style={{ color: "#111" }}>{inddata.discount}</span> </h5>
                                <h4>FREE Delivery : <span style={{ color: "#111", fontWeight: "600" }}>Oct 8 - 21</span> Details</h4>
                                <p style={{ color: "#111" }}>Fastest delivery: <span style={{ color: "#111", fontWeight: "600" }}> Tomorrow 11AM</span></p>
                            </div>
                            <p className="description">About the Iteam : <span style={{ color: "#565959", fontSize: "14px", fontWeight: "500", letterSpacing: "0.4px" }}>{inddata.description}</span></p>
                        </div>
                    </div>

                    <div className="reviews_section">
                        <h2>Customer Reviews</h2>
                        <div className="reviews_summary">
                            <StarRating rating={inddata.rating} />
                            <span>{inddata.numReviews} reviews</span>
                        </div>
                        <Divider />
                        
                        <div className="reviews_list">
                            {inddata.reviews && inddata.reviews.length === 0 && <p>Be the first to review this product.</p>}
                            {inddata.reviews && inddata.reviews.map(review => (
                                <div key={review._id} className="review_item">
                                    <strong>{review.name}</strong>
                                    <StarRating rating={review.rating} />
                                    <p className="review_date">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    <p>{review.comment}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="review_form_container">
                            <h3>Write a customer review</h3>
                            {account ? (
                                <form onSubmit={submitReviewHandler}>
                                    <div className="form_group">
                                        <label htmlFor="rating">Rating</label>
                                        <select id="rating" value={rating} onChange={(e) => setRating(e.target.value)} required>
                                            <option value="">Select...</option>
                                            <option value="1">1 - Poor</option>
                                            <option value="2">2 - Fair</option>
                                            <option value="3">3 - Good</option>
                                            <option value="4">4 - Very Good</option>
                                            <option value="5">5 - Excellent</option>
                                        </select>
                                    </div>
                                    <div className="form_group">
                                        <label htmlFor="comment">Comment</label>
                                        {/* --- THIS IS THE TYPO FIX --- */}
                                        <textarea id="comment" rows="4" value={comment} onChange={(e) => setComment(e.target.value)} required></textarea>
                                    </div>
                                    <button type="submit" className="cart_btn1">Submit Review</button>
                                    {reviewStatus && <p className="review_status">{reviewStatus}</p>}
                                </form>
                            ) : (
                                <p>Please <a href="/login">sign in</a> to write a review.</p>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className='circle'>
                    <h2>Product not found.</h2>
                </div>
            )}
        </div>
    );
};

export default Cart;