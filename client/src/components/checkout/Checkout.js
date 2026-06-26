import React, { useContext, useState, useEffect } from 'react'; 
import { LoginContext } from '../context/ContextProvider';
import { useNavigate } from 'react-router-dom';
import StripeForm from './StripeForm'; 
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

const Checkout = () => {
    const { account, setAccount } = useContext(LoginContext);
    const navigate = useNavigate();
    const [step, setStep] = useState(1); 
    
    const [newAddressData, setNewAddressData] = useState({
        houseno: "", street: "", landmark: "", city: "", state: "", pincode: "", country: "India"
    });
    
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState('cod'); 
    const [selectedShipping, setSelectedShipping] = useState('standard'); 
    const [clientSecret, setClientSecret] = useState(''); 
    
    // Define cartItems early using optional chaining
    const cartItems = account?.carts || [];

    // --- HOOKS (Must be at the top level) ---

    // Auto-select first address if one exists and none is selected yet
    useEffect(() => {
        if (account?.address?.length > 0 && !selectedAddress) {
            setSelectedAddress(account.address[0]);
        }
    }, [account, selectedAddress]);

    // ✅ FIX 1: Redirect if not logged in (Hook is at top level)
    useEffect(() => {
        if (!account) { 
            navigate('/login'); 
        }
    }, [account, navigate]); 

    // ✅ FIX 2: Redirect if cart is empty (Hook is at top level)
    useEffect(() => {
        // Check for account to avoid redirect on initial load before account is set
        if (account && cartItems.length === 0 && step !== 3) { 
            navigate('/'); 
        }
    }, [account, cartItems.length, step, navigate]);


    // --- EARLY RETURNS (Allowed after all Hooks) ---

    // Return null to show nothing while redirecting
    if (!account) { 
        return null; 
    }
    
    // Return error if cart is empty (allow step 3 to proceed after order)
    if (cartItems.length === 0 && step !== 3) { 
        return <div className="checkout_error">Your cart is empty. Please add items to proceed.</div>;
    }

    // --- Calculation Functions ---
    const calculateTotalCost = (items) => {
        const itemCost = items.reduce((acc, item) => acc + (item.price.cost * (item.quantity || 1)), 0);
        const shippingFee = selectedShipping === 'express' ? 99 : 0;
        return (itemCost + shippingFee).toFixed(2);
    };

    const finalTotal = calculateTotalCost(cartItems);

    // --- Address Handler Functions ---
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setNewAddressData(prev => ({ ...prev, [name]: value }));
    };

    const submitNewAddress = async (e) => {
        e.preventDefault();
        
        if (!newAddressData.houseno || !newAddressData.street || !newAddressData.city || !newAddressData.pincode) {
            toast.error("Please fill all required address fields.", { position: "top-center" });
            return;
        }

        const res = await fetch("/add-address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newAddressData)
        });

        const updatedUser = await res.json();

        if (res.status === 201) {
            toast.success("Address added successfully!", { position: "top-center" });
            setNewAddressData({ houseno: "", street: "", landmark: "", city: "", state: "", pincode: "", country: "India" });
            
            if (setAccount) {
                setAccount(updatedUser);
            }
            // Automatically select the new address just added
            setSelectedAddress(updatedUser.address[updatedUser.address.length - 1]);
            
        } else {
            toast.error(`Failed to add address: ${updatedUser.error}`, { position: "top-center" });
        }
    };
    
    // --- Create Payment Intent ---
    const createPaymentIntent = async () => {
        const amount = parseFloat(finalTotal);

        try {
            const res = await fetch("/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ amount: amount }) 
            });

            const data = await res.json();
            
            if (res.status === 200 && data.clientSecret) {
                setClientSecret(data.clientSecret);
                return data.clientSecret;
            }
            throw new Error(data.error || 'Failed to create Payment Intent');
        } catch (error) {
            console.error("Payment Intent Error:", error);
            toast.error("Could not start payment. Try selecting COD.", { position: "top-center" });
            return null; // Indicate failure
        }
    };
    
    // --- Final Order Placement Function ---
    const placeOrder = async (isStripeSuccess = false) => {
        if (!selectedAddress) {
            toast.warn("Please go back and select a shipping address.", { position: "top-center" });
            setStep(1);
            return;
        }
        
        // If card payment is selected, but Stripe hasn't succeeded yet, try to create the intent
        if (selectedPayment === 'card' && !isStripeSuccess) {
            const secret = await createPaymentIntent(); 
            // Only proceed if secret was successfully created
            if (!secret) return; 
            // Don't place the order yet; StripeForm will handle it after payment
            return; 
        }
        
        // If we reach here, it's either COD or a successful Stripe payment
        const orderType = selectedPayment === 'card' ? 'Card Payment (Stripe)' : 'Cash On Delivery';
        
        const orderDetails = {
            products: cartItems, 
            shippingAddress: selectedAddress,
            paymentMethod: orderType,
            totalAmount: finalTotal, 
            shippingMethod: selectedShipping
        };

        try {
            const res = await fetch("/place-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(orderDetails)
            });

            const result = await res.json();

            if (!res.ok) { // Check if response status is not 2xx
                 throw new Error(result.error || `HTTP error! Status: ${res.status}`);
            }

            // If order placement was successful (status 201)
            toast.success("Order Placed Successfully!", { position: "top-center" });
            
            // Refetch user data to update the cart in context
            if (setAccount) {
                try {
                    const userRes = await fetch("/validuser", {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include"
                    });
                     if (!userRes.ok) throw new Error('Failed to refetch user');
                    const user = await userRes.json();
                    setAccount(user); // Update context with empty cart
                } catch (fetchError) {
                     console.error("Failed to refetch user after order:", fetchError);
                     // Proceed even if refetch fails, user can refresh later
                }
            }
            navigate('/my-account'); // Go to orders page

        } catch (error) {
            toast.error(`Order Failed: ${error.message || 'Server error.'}`, { position: "top-center" });
            console.error("Order Failure:", error);
        }
    };

    // --- Render Functions ---
    const renderStep = () => {
        const savedAddresses = account?.address || [];
        
        switch (step) {
            case 1:
                return (
                    <div className="address-step">
                        <h3 className="checkout-section-title">1. Select a Delivery Address</h3>
                        
                        <div className="saved-addresses-list" style={{ marginBottom: '20px' }}>
                            {savedAddresses.length > 0 ? (
                                savedAddresses.map((addr, index) => (
                                    <div key={addr._id || index} className="address-card" style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                                        <input type="radio" 
                                            name="selectedAddress" 
                                            id={`address-${index}`} 
                                            value={index} 
                                            checked={selectedAddress?._id === addr._id}
                                            onChange={() => setSelectedAddress(addr)}
                                        />
                                        <label htmlFor={`address-${index}`} style={{ fontWeight: '600', marginLeft: '10px' }}>
                                            {account.fname} ({addr.houseno})
                                        </label>
                                        <p style={{ margin: '5px 0 0 25px', fontSize: '14px' }}>
                                            {addr.street}, {addr.landmark && addr.landmark + ', '} 
                                            {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="no-address-found" style={{ padding: '15px', border: '1px solid #f00', backgroundColor: '#fee' }}>
                                    <p>No addresses saved. Please add a new delivery address below.</p>
                                </div>
                            )}
                        </div>
    
                        <button 
                            onClick={() => {
                                if (selectedAddress) {
                                    setStep(2);
                                } else {
                                    toast.error("Please select or add a shipping address.", { position: "top-center" });
                                }
                            }}
                            className="checkout-continue-btn"
                            style={{ backgroundColor: '#f0c14b', border: '1px solid #a88734', padding: '10px 20px', borderRadius: '3px', cursor: 'pointer' }}
                        >
                            Continue to Delivery Options
                        </button>
    
                        <h3 className="checkout-section-title" style={{ marginTop: '30px' }}>Or Add a New Address</h3>
                        
                        <div className="new-address-form-container" style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '5px' }}>
                            <form onSubmit={submitNewAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input type="text" name="houseno" placeholder="House No / Building" onChange={handleAddressChange} value={newAddressData.houseno} required style={{ padding: '8px', border: '1px solid #ccc', gridColumn: 'span 2' }}/>
                                <input type="text" name="street" placeholder="Street / Area" onChange={handleAddressChange} value={newAddressData.street} required style={{ padding: '8px', border: '1px solid #ccc', gridColumn: 'span 2' }}/>
                                <input type="text" name="landmark" placeholder="Landmark (Optional)" onChange={handleAddressChange} value={newAddressData.landmark} style={{ padding: '8px', border: '1px solid #ccc', gridColumn: 'span 2' }}/>
                                <input type="text" name="city" placeholder="City" onChange={handleAddressChange} value={newAddressData.city} required style={{ padding: '8px', border: '1px solid #ccc' }}/>
                                <input type="text" name="state" placeholder="State" onChange={handleAddressChange} value={newAddressData.state} required style={{ padding: '8px', border: '1Two-Column 1px solid #ccc' }}/>
                                <input type="text" name="pincode" placeholder="Pincode" onChange={handleAddressChange} value={newAddressData.pincode} required style={{ padding: '8px', border: '1px solid #ccc' }}/>
                                <input type="text" name="country" placeholder="Country" onChange={handleAddressChange} value={newAddressData.country} readOnly style={{ padding: '8px', border: '1px solid #ccc', backgroundColor: '#eee' }}/>
                                
                                <button type="submit" className="save-btn" style={{ backgroundColor: '#007185', color: 'white', padding: '10px', border: 'none', borderRadius: '3px', cursor: 'pointer', gridColumn: 'span 2', marginTop: '10px' }}>
                                    Save and Use This Address
                                </button>
                            </form>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="delivery-step">
                        <h3 className="checkout-section-title">2. Review Order & Select Delivery/Payment Option</h3>
    
                        <div className="delivery-options" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}>
                            
                            <h4>Delivery Address:</h4>
                            <p style={{ fontWeight: '600', color: '#111' }}>Ship To: {selectedAddress?.street}, {selectedAddress?.city} - {selectedAddress?.pincode}</p>
                            
                            <h4 style={{ marginTop: '15px' }}>Delivery Estimate</h4>
                            <p style={{ fontWeight: '600', color: '#007185' }}>Estimated Delivery: {selectedShipping === 'standard' ? '4 - 7 Business Days (FREE)' : '1 - 2 Business Days (₹99.00)'}</p>
                            
                            <div className="shipping-options" style={{ marginTop: '15px' }} onChange={(e) => setSelectedShipping(e.target.value)}>
                                <h4 style={{ borderTop: '1px dashed #ccc', paddingTop: '10px' }}>Shipping Method</h4>
                                <label style={{ display: 'block', margin: '10px 0' }}>
                                    <input type="radio" name="shippingMethod" value="standard" defaultChecked={selectedShipping === 'standard'} style={{ marginRight: '8px' }} />
                                    Standard Shipping (Free)
                                </label>
                                <label style={{ display: 'block', margin: '10px 0' }}>
                                    <input type="radio" name="shippingMethod" value="express" defaultChecked={selectedShipping === 'express'} style={{ marginRight: '8px' }} />
                                    Express Shipping (₹99.00)
                                </label>
                            </div>
                        </div>
    
                        <div className="payment-method-options" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }} onChange={(e) => setSelectedPayment(e.target.value)}>
                            <h4>Payment Method</h4>
                            <label style={{ display: 'block', margin: '10px 0' }}>
                                <input type="radio" name="paymentMethod" value="cod" defaultChecked={selectedPayment === 'cod'} style={{ marginRight: '8px' }} />
                                <strong>Cash on Delivery (COD)</strong>
                            </label>
                            <label style={{ display: 'block', margin: '10px 0' }}>
                                <input type="radio" name="paymentMethod" value="card" defaultChecked={selectedPayment === 'card'} style={{ marginRight: '8px' }} />
                                Credit/Debit Card 
                            </label>
                        </div>
                        
                        <button 
                            onClick={() => setStep(3)} 
                            className="checkout-proceed-btn"
                            style={{ marginTop: '20px', backgroundColor: '#007185', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                            Proceed to Review Order
                        </button>
                    </div>
                );
            case 3:
                return (
                    <div className="review-step">
                        <h3 className="checkout-section-title">3. Review and Place Order</h3>
                        
                        <div className="order-summary" style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px' }}>
                            <h4 style={{ color: '#007185' }}>Shipping To:</h4>
                            {/* Check if selectedAddress exists before accessing properties */}
                            <p>{selectedAddress ? `${selectedAddress.houseno}, ${selectedAddress.street}, ${selectedAddress.city} - ${selectedAddress.pincode}` : 'No address selected'}</p>
                            
                            <h4 style={{ marginTop: '15px', color: '#007185' }}>Payment Method:</h4>
                            <p style={{ fontWeight: '600' }}>
                                {selectedPayment === 'cod' ? 'Cash On Delivery' : 'Credit/Debit Card (External Gateway)'}
                            </p>

                            <h4 style={{ marginTop: '15px', color: '#007185' }}>Order Summary:</h4>
                            <p>Items ({cartItems.length} items): <span>₹{(calculateTotalCost(cartItems) - (selectedShipping === 'express' ? 99 : 0)).toFixed(2)}</span></p>
                            <p>Shipping: <span>{selectedShipping === 'express' ? '₹99.00' : 'FREE'}</span></p>
                            <h3 style={{ marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                                Order Total: <span style={{ fontWeight: '700', color: '#B12704' }}>₹{finalTotal}</span>
                            </h3>
                        </div>

                        {/* Conditional Rendering for Payment */}
                        {selectedPayment === 'card' ? (
                            clientSecret ? (
                                <StripeForm 
                                    clientSecret={clientSecret} 
                                    onPaymentSuccess={() => placeOrder(true)} 
                                />
                            ) : (
                                <button 
                                    onClick={() => placeOrder()} 
                                    className="checkout-place-order-btn"
                                    style={{ backgroundColor: '#f0c14b', color: 'black', padding: '12px 25px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                    Proceed to Card Payment
                                </button>
                            )
                        ) : (
                            <button 
                                onClick={() => placeOrder(false)} 
                                className="checkout-place-order-btn"
                                style={{ backgroundColor: '#ff9900', color: 'black', padding: '12px 25px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                                Place Order & Pay Cash
                            </button>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="checkout_container">
            <ToastContainer /> 
            <h1>Secure Checkout</h1>
            {renderStep()}
        </div>
    );
};

export default Checkout;