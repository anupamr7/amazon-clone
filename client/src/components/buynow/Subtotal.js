import React from 'react'

const Subtotal = ({ iteam }) => {
    // Calculate total cost and total items from the array
    const totalCost = iteam.reduce((acc, item) => acc + (item.price.cost * (item.quantity || 1)), 0);
    const totalItems = iteam.reduce((acc, item) => acc + (item.quantity || 1), 0);

    return (
        <div className='sub_item'>
            <h3>Subtotal ({totalItems} items): <strong style={{ fontWeight: 700, color: "#111" }}>₹{totalCost}.00</strong></h3>
        </div>
    );
};

export default Subtotal;