import React from 'react'
import { useNavigate } from 'react-router-dom';

const Right = ({ iteam }) => {
    const navigate = useNavigate();
    
    // Calculate total cost and total items from the array
    const totalCost = iteam.reduce((acc, item) => acc + (item.price.cost * (item.quantity || 1)), 0);
    const totalItems = iteam.reduce((acc, item) => acc + (item.quantity || 1), 0);

    return (
        <div className='right_buy'>
            <img src="https://images-eu.ssl-images-amazon.com/images/G/31/checkout/assets/TM_desktop._CB443006202.png" alt="" />
            <div className='cost_right'>
                <p>Your order is eligible for FREE Delivery.</p> <br />
                <span style={{ color: "#565959" }}>Select this option at checkout. Details</span>
                <h3>Subtotal ({totalItems} items): <span style={{ fontWeight: 700 }}>₹{totalCost}.00</span></h3>
                
                {/* 👇 ADDED onClick HANDLER TO NAVIGATE TO CHECKOUT PAGE */}
                <button 
                    className='rightbuy_btn'
                    onClick={() => navigate('/checkout')}
                >
                    Process to Buy
                </button>
                
                <div className='emi'>
                    Emi available
                </div>
            </div>
        </div>
    )
}

export default Right;