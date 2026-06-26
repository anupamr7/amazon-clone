import { React, useContext } from 'react';
import { LoginContext } from "../context/ContextProvider";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Option = ({ deletedata, get, onQuantityChange, quantity }) => { 
    const { account, setAccount } = useContext(LoginContext);

    // --- REMOVE ITEM FROM CART FUNCTION (Improved Error Handling) ---
    const removedata = async () => {
        try {
            const res = await fetch(`/remove/${deletedata}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            
            const data = await res.json();

            // --- UPDATED: Use res.ok for better error checking ---
            if (!res.ok) {
                toast.error(data.error || "Failed to delete item.", { position: "top-center" });
            } else {
                setAccount(data); 
                toast.success("Item removed from cart.", { position: "top-center" });
                get(); // Refresh local cart data
            }
        } catch (error) {
            console.error("Error during item removal:", error);
            toast.error("Network error removing item.", { position: "top-center" });
        }
    };

    // --- SAVE FOR LATER FUNCTION (FIXED) ---
    const saveForLater = async () => {
        try {
            // --- UPDATED: Correct URL ---
            const res = await fetch(`/save-for-later/${deletedata}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            
            const data = await res.json();
            
            // --- UPDATED: Check for res.ok (catches 200) ---
            if (!res.ok) {
                toast.error(data.error || "Failed to move item.", { position: "top-center" });
            } else {
                setAccount(data); // This now expects the full user object
                toast.success("Item moved to Saved for Later!", { position: "top-center" });
                get(); // Refresh the cart view
            }
        } catch (error) {
            console.error("Error saving for later:", error);
            toast.error("Network error saving item.", { position: "top-center" });
        }
    };
    
    return (
        <div className='add_remove_select'>
            <select
                value={quantity}
                onChange={(e) => onQuantityChange(deletedata, e.target.value)}
            >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
            </select>
            
            <div className='item_options'>
                <button onClick={removedata}>Delete</button>
                <span className="separator">|</span>
                <button onClick={saveForLater}>Save for later</button>
                <span className="separator">|</span>
                <button>See More Like this</button>
            </div>

            <ToastContainer />
        </div>
    );
};

export default Option;