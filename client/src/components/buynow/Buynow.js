import React, { useEffect, useState, useContext } from 'react';
import { Divider } from '@mui/material';
import Option from './Option';
import Right from './Right';
import Subtotal from './Subtotal';
import "./buynow.css";
import { LoginContext } from '../context/ContextProvider';
import { NavLink } from 'react-router-dom';

const Buynow = () => {
    const { account } = useContext(LoginContext);
    const [cartdata, setCartdata] = useState([]);

    // --- UPDATED getdatabuy FUNCTION ---
    const getdatabuy = async () => {
        const res = await fetch("/cartdetails", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        const data = await res.json();

        // Check for 200 (OK) instead of 201 (Created)
        if (res.status !== 200) { 
            console.log("error fetching cart data");
        } else {
            // Data is now just the array, not the user object
            setCartdata(Array.isArray(data) ? data : []); 
        }
    };

    const updateQuantity = (itemId, newQuantity) => {
        setCartdata(prevCartdata => {
            return prevCartdata.map(item =>
                item.id === itemId ? { ...item, quantity: parseInt(newQuantity) } : item
            );
        });
    };

    useEffect(() => {
        getdatabuy();
    }, []);

    return (
        <div className='buynow_section'>
            {
                cartdata && cartdata.length > 0 ? (
                    <div className='buynow_container'>
                        <div className='left_buy'>
                            <h1>Shopping Cart</h1>
                            <p>Select all items</p>
                            <span className='leftbuyprice'>Price</span>
                            <Divider />
                            {cartdata.map((e, k) => (
                                <div key={k} className='item_container'>
                                    <img src={e.url} alt="product" />
                                    <div className='item_details'>
                                        <h3>{e.title.longTitle}</h3>
                                        <h3>{e.title.shortTitle}</h3>
                                        <h3 className='diffrentprice'>₹{e.price.cost}</h3>
                                        <p className='unusuall'>Usually dispatched in 8 days.</p>
                                        <p>Eligible for FREE Shipping</p>
                                        <img src="https://m.media-amazon.com/images/G/31/marketing/fba/fba-badge_18px-2x._CB485942108_.png" alt="fba" />
                                        <Option
                                            deletedata={e.id}
                                            get={getdatabuy}
                                            quantity={e.quantity || 1}
                                            onQuantityChange={updateQuantity}
                                        />
                                    </div>
                                    <h3 className='item_price'>₹{(e.price.cost * (e.quantity || 1)).toFixed(2)}</h3>
                                </div>
                            ))}
                            <Subtotal iteam={cartdata} />
                        </div>
                        <Right iteam={cartdata} />
                    </div>
                ) : (
                    <div className='buynow_container'>
                        <div className='empty_cart'>
                            <h2>Your Amazon Cart is empty.</h2>
                            <p>Your Shopping Cart lives to serve. Give it purpose — fill it with electronics, clothing, household supplies, and more.</p>
                            <NavLink to="/" className="continue_shopping_btn">Continue Shopping</NavLink>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default Buynow;