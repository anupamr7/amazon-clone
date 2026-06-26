import { React, useContext, useEffect, useState } from 'react';
import "./navbar.css";
import SearchIcon from '@mui/icons-material/Search';
// --- 1. REMOVED Badge IMPORT ---
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Avatar from '@mui/material/Avatar';
import { NavLink, useNavigate } from 'react-router-dom';
import { LoginContext } from "../context/ContextProvider";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import { ToastContainer, toast } from 'react-toastify';
import { useSelector } from "react-redux";
import amazonLogo from '../../assets/amazon-logo.png'; 

const Navbaar = () => {
    const { account, setAccount } = useContext(LoginContext);
    const history = useNavigate();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const logoutuser = async () => {
        const res = await fetch("/logout", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        
        if (res.status !== 200) {
            console.log("error logging out");
        } else {
            toast.success("Logged out successfully.", { position: "top-center" });
            setAccount(null);
            handleClose();
            history("/");
        }
    };
    
    const [text, setText] = useState("");
    const { products } = useSelector(state => state.getProductsdata);

    // --- NEW SEARCH FUNCTION ---
    const getText = (text) => {
        if (text) {
            // Filter the products already loaded in Redux state
            const result = products.filter(product => 
                product.title.shortTitle.toLowerCase().includes(text.toLowerCase())
            );
            
            if(result.length > 0){
                // If a match is found, navigate to the first matching product's detail page
                history(`/getproductsone/${result[0].id}`);
                setText(""); // Clear the search bar
            } else {
                toast.warning("No product found matching your search.");
            }
        } else {
             toast.error("Please enter a search term.");
        }
    }

    return (
        <header>
            <nav>
                <div className="left">
                    <div className="navlogo">
                        <NavLink to="/"><img src={amazonLogo} alt="logo" /></NavLink>
                    </div>
                    <div className="nav_searchbaar">
                        <input type="text" name=""
                            onChange={(e) => setText(e.target.value)}
                            value={text} 
                            placeholder='Search your products'
                            id="" />
                        
                        {/* --- UPDATED SEARCH ICON WITH ONCLICK --- */}
                        <div className="search_icon" onClick={() => getText(text)}>
                            <SearchIcon id="search" />
                        </div>
                    </div>
                </div>
                <div className="right">
                    <NavLink to="/kindle-store" className="nav-link-kindle">Amazon Kindle</NavLink>
                    
                    <div className="nav_btn">
                        {!account && <NavLink to="/login">Signin</NavLink>}
                    </div>
                    
                    <div className='cart_btn'>
                        {/* --- 2. REMOVED <Badge> WRAPPER --- */}
                        <NavLink to={account ? "/buynow" : "/login"}>
                            <ShoppingCartIcon id="icon" /> 
                        </NavLink>
                        <p>Cart</p>
                    </div>
                    
                    {account ? (
                        <Avatar className='avtar' onClick={handleClick}>
                            {account.fname[0].toUpperCase()}
                        </Avatar>
                    ) : (
                        <NavLink to="/login">
                             <Avatar className='avtar' />
                        </NavLink>
                    )}

                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
                    >
                        <MenuItem onClick={() => { handleClose(); history('/my-account'); }}>My account</MenuItem>
                        
                        {account && (
                            <MenuItem onClick={() => { logoutuser(); handleClose(); }}>
                                <LogoutIcon style={{ fontSize: 16, marginRight: 3 }} />Logout
                            </MenuItem>
                        )}
                    </Menu>
                </div>
            </nav>
            <ToastContainer />
        </header>
    );
};

export default Navbaar;