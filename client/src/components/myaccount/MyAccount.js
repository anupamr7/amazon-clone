import React, { useContext, useEffect, useState } from 'react';
import { LoginContext } from '../context/ContextProvider';
import { NavLink, useNavigate } from 'react-router-dom';
import "./myaccount.css";

const MyAccount = () => {
    const navigate = useNavigate();
    const { account, setAccount, getLatestUserData } = useContext(LoginContext); 
    
    const [savedItems, setSavedItems] = useState([]);
    const [digitalLibrary, setDigitalLibrary] = useState([]); 
    const [allBooks, setAllBooks] = useState([]);
    const [orders, setOrders] = useState([]);

    const fetchAllBooks = async () => {
        try {
            const res = await fetch("/get-digital-books");
            const data = await res.json();
            if (res.status === 200) {
                setAllBooks(data);
                return data;
            }
        } catch (error) {
            console.error("Failed to fetch all books for lookup:", error);
        }
        return [];
    };

    const getSavedItems = async () => {
        if (!account) return; 
        const res = await fetch("/get-savelater-items", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await res.json();
        if (res.status === 201) {
            setSavedItems(data);
        }
    };

    const fetchOrders = async () => {
        if (!account) return;
        try {
            const res = await fetch("/getorders", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const data = await res.json();
            if (res.status === 200) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Error fetching user orders:", error);
        }
    };
    
    const getDigitalLibrary = (allBooksData) => {
        if (!account || !account.digitalLibrary) return;
        
        const bookMap = new Map(allBooksData.map(book => [book.bookId, book]));

        const libraryWithDetails = account.digitalLibrary.map(item => {
            const bookDetail = bookMap.get(item.bookId);
            return {
                ...item,
                title: bookDetail ? bookDetail.title : 'Book Not Found',
                author: bookDetail ? bookDetail.author : 'N/A',
                coverUrl: bookDetail ? bookDetail.coverUrl : 'placeholder.png',
                downloadLink: bookDetail ? bookDetail.downloadLink : '#',
                purchaseDate: item.purchaseDate || new Date(), 
            };
        });
        
        setDigitalLibrary(libraryWithDetails); 
    };

    const removeSavedItem = async (itemId) => {
        if (!account) return; 
        try {
            const res = await fetch(`/remove-savelater/${itemId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            
            if (res.status === 201) {
                getSavedItems();
            } 
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const removeAddress = async (addressId) => {
        if (!account) return;
        try {
            const res = await fetch(`/remove-address/${addressId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            
            const updatedUser = await res.json();
            
            if (res.status === 201) {
                if (setAccount) {
                    setAccount(updatedUser); 
                }
                alert("Address removed successfully.");
            } else {
                alert(`Failed to remove address: ${updatedUser.error || 'Check server logs.'}`);
            }
        } catch (error) {
            console.error("Network error removing address:", error);
        }
    };
    
    const handleDownload = (downloadLink) => {
        if (downloadLink && downloadLink !== '#') {
            window.open(downloadLink, '_blank'); 
        } else {
            alert('Download link is unavailable.');
        }
    };

    const removeLibraryBook = async (bookId) => {
        if (!account) return; 
        try {
            const res = await fetch(`/remove-library-book/${bookId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            
            const updatedUser = await res.json();
            
            if (res.status === 201) {
                 if (setAccount) {
                     setAccount(updatedUser); 
                 }
                alert("Book removed from library.");
            } else {
                alert(`Failed to remove book: ${updatedUser.error || 'Check server logs.'}`);
            }
        } catch (error) {
            console.error("Network error removing book:", error);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmation = window.confirm(
            "Are you sure you want to delete your account? This action is permanent and cannot be undone."
        );

        if (!confirmation) {
            return;
        }

        try {
            const res = await fetch('/delete-account', {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                alert('Your account has been successfully deleted.');
                setAccount(null);
                navigate('/');
            } else {
                const data = await res.json();
                alert(`Failed to delete account: ${data.message || 'Please try again later.'}`);
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            alert('A network error occurred. Please try again.');
        }
    };

    useEffect(() => {
        if (account && account.fname) { 
            getSavedItems();
            fetchOrders();
            fetchAllBooks().then(booksData => {
                if (booksData) {
                    getDigitalLibrary(booksData);
                }
            });
        }
    }, [account]);

    return (
        <div className="myaccount_container">
            <h2>My Account</h2>
            
            <div className="user_details">
                <h3>User Information</h3>
                {account && account.fname ? (
                    <div className="user_details_content">
                        <p><strong>Name:</strong> {account.fname}</p>
                        <p><strong>Email:</strong> {account.email}</p>
                        <p><strong>Mobile:</strong> {account.mobile}</p>
                        
                        <h4 style={{ marginTop: '15px' }}>Your Saved Addresses</h4>
                        {account.address && account.address.length > 0 ? (
                            account.address.map((addr, index) => (
                                <div key={addr._id} className="existing_address" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingRight: '10px' }}>
                                    <p>Address {index + 1}: {addr.houseno}, {addr.street}, {addr.city} - {addr.pincode}</p>
                                    <button 
                                        onClick={() => removeAddress(addr._id)} 
                                        className="remove_address_btn"
                                        style={{ backgroundColor: '#cc0000', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No addresses saved yet. (Add one in Checkout)</p>
                        )}
                    </div>
                ) : (
                    <p>Please sign in to view your details.</p>
                )}
            </div>
            
            <div className="orders_section">
                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #232f3e', paddingBottom: '10px' }}>
                    Your Orders
                </h3>
                {orders.length > 0 ? (
                    orders.map(order => (
                        <div className="order_container" key={order._id}>
                            <div className="order_header">
                                <div>
                                    <p>ORDER PLACED</p>
                                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p>TOTAL</p>
                                    <p>₹{order.totalAmount.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p>ORDER # {order._id}</p>
                                </div>
                            </div>
                            {order.products.map(product => (
                                <div className="product_in_order" key={product.productId}>
                                    <img src={product.url} alt={product.title.shortTitle} />
                                    <div className="product_details">
                                        <h4>{product.title.longTitle}</h4>
                                        <p>Price: ₹{product.price.cost}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <p>You haven't placed any orders yet.</p>
                )}
            </div>
            
            <div className="orders_section">
                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #ff9900', paddingBottom: '10px', color: '#ff9900' }}>
                    My Digital Library ({digitalLibrary.length})
                </h3>
                {digitalLibrary.length > 0 ? (
                    <div className="library-list" style={{ padding: '15px 0', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {digitalLibrary.map(item => (
                            <div key={item.bookId} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', maxWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img 
                                    src={item.coverUrl || "placeholder.png"} 
                                    alt={item.title} 
                                    style={{ width: '100px', height: '150px', objectFit: 'contain', marginBottom: '10px' }} 
                                />
                                <div style={{ width: '100%', textAlign: 'left', marginBottom: '10px' }}>
                                    <p style={{ margin: '2px 0' }}><strong>Title:</strong> {item.title}</p> 
                                    <p style={{ margin: '2px 0' }}><strong>Author:</strong> {item.author}</p>
                                    <p style={{ margin: '2px 0' }}><strong>Purchased:</strong> {new Date(item.purchaseDate).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => handleDownload(item.downloadLink)}
                                    style={{ background: '#007185', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '10px', borderRadius: '3px', width: '100%' }}
                                >
                                    Download
                                </button>
                                <button 
                                    onClick={() => removeLibraryBook(item.bookId)}
                                    style={{ background: '#cc0000', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginTop: '5px', borderRadius: '3px', width: '100%' }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>You haven't purchased any digital content yet.</p>
                )}
            </div>

            <div className="wishlist_section">
                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Saved for Later ({savedItems.length})</h3>
                {savedItems.length > 0 ? (
                    <div className="saved_items_list">
                        {savedItems.map((item) => (
                            <div key={item.id} className="saved_item">
                                <NavLink to={`/getproductsone/${item.id}`} className="saved_item_link">
                                    <img src={item.url} alt={item.title.shortTitle} />
                                    <p>{item.title.longTitle}</p>
                                    <p>₹{item.price.cost}</p>
                                </NavLink>
                                <button onClick={() => removeSavedItem(item.id)} className="remove_button">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Your wishlist is empty.</p>
                )}
            </div>

            {account && (
                <div className="account_actions">
                    <h3>Account Actions</h3>
                    <p>Permanently delete your account and all associated data.</p>
                    <button className="delete_account_btn" onClick={handleDeleteAccount}>
                        Delete Account
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyAccount;