import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginContext } from '../context/ContextProvider';
import CircularProgress from '@mui/material/CircularProgress';
import './DigitalStore.css';

const DigitalStore = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { account, getLatestUserData } = useContext(LoginContext);
    const navigate = useNavigate();

    const fetchBooks = async () => {
        try {
            const res = await fetch("/get-digital-books");
            const data = await res.json();
            if (res.status === 200) {
                setBooks(data);
            }
        } catch (error) {
            console.error("Failed to fetch books:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (book) => {
        if (!account) {
            alert("Please sign in to purchase.");
            navigate('/login');
            return;
        }
        
        const res = await fetch(`/purchase-book/${book.bookId}`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        const result = await res.json();
        
        if (res.ok) {
            if (getLatestUserData) await getLatestUserData(); 
            alert(`SUCCESS! "${book.title}" has been added to your Digital Library.`);
        } else {
            alert(result.message || "Purchase failed. Please try again.");
            console.error("Purchase Failed:", result);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><CircularProgress /><p>Loading Digital Store...</p></div>;
    }

    return (
        <div className="digital-store-container">
            <h1>Amazon Digital Store (Kindle)</h1>
            <div className="books-grid">
                {books.map(book => (
                    <div key={book.bookId} className="book-card">
                        <img src={book.coverUrl || "placeholder.png"} alt={book.title} />
                        <div className="book-details-content">
                            <h4 className="book-title">{book.title}</h4>
                            <p className="book-author">by {book.author}</p>
                            <p className="book-price">₹{book.price.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handlePurchase(book)} className="buy-now-button">
                            Buy Now
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DigitalStore;