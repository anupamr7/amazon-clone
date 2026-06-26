import React, { createContext, useState, useEffect } from 'react';

// Create a new context for login information
export const LoginContext = createContext(null);

const ContextProvider = ({ children }) => {
    // Note: We initialize with null instead of "" for better boolean checks (account ? ...)
    const [account, setAccount] = useState(null); 

    // 👇 NEW FUNCTION TO REFRESH USER DATA FROM BACKEND
    const getLatestUserData = async () => {
        try {
            // Assumes /validuser is the protected route that returns the full user document
            const res = await fetch("/validuser", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const data = await res.json();

            // --- THIS IS THE FIX ---
            // The /validuser route returns 200 (OK), not 201 (Created)
            if (res.status === 200) {
                setAccount(data); // Update global state with latest digitalLibrary, addresses, etc.
                return data;
            }
            // If user is logged out or session expired, set account to false/null
            setAccount(null); 
            return null;

        } catch (error) {
            console.error("Error during user refresh:", error);
            setAccount(null);
            return null;
        }
    };
    
    // CRITICAL: This useEffect runs once on mount to check for an existing session (cookie)
    // and whenever the account state changes, ensuring the Navbar/Header knows who is logged in.
    useEffect(() => {
        getLatestUserData();
    }, []); 

    return (
        // 👇 EXPOSE THE NEW FUNCTION IN THE CONTEXT VALUE
        <LoginContext.Provider value={{ account, setAccount, getLatestUserData }}> 
            {children}
        </LoginContext.Provider>
    );
};

export default ContextProvider;