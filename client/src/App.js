import './App.css';
import Navbaar from './components/header/Navbaar';
import Newnav from './components/newnavbaar/Newnav';
import Maincomp from './components/home/Maincomp';
import Footer from './components/footer/Footer';
import Sign_in from './components/signup-sign/Sign_in';
import SignUp from './components/signup-sign/SignUp';
import Cart from './components/cart/Cart';
import Buynow from './components/buynow/Buynow';
import MyAccount from './components/myaccount/MyAccount'; 
import Checkout from './components/checkout/Checkout'; 
import { Routes, Route } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import DigitalStore from './components/digitalstore/DigitalStore';
import ViewAll from './components/viewall/ViewAll'; // Corrected import path

// Stripe Promise (can be left for the physical product checkout)
const stripePromise = loadStripe('pk_test_51SBLJSCNXxP5sMkG2BcVnkfUJoDfNX5FkNB4dk82bN0oZQvLwmpedxSl6ltNrVXyWKDLl9NRxcZemsUFcyO9XQGM002vAtDHKh'); 


function App() {
  const [data, setData] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setData(true)
    }, 2000);
  }, []);

  return (
    <>
      {
        data ? (
          <>
            <Navbaar />
            <Newnav />
            <Routes>
              <Route path="/" element={<Maincomp />} />
              <Route path="/login" element={<Sign_in />} />
              <Route path="/register" element={<SignUp />} />
              <Route path="/getproductsone/:id" element={<Cart />} />
              <Route path="/buynow" element={<Buynow />} />
              <Route path="/my-account" element={<MyAccount />} />
              <Route path="/kindle-store" element={<DigitalStore />} />
              <Route path="/products" element={<ViewAll />} />

              <Route path="/checkout" element={
                  <Elements stripe={stripePromise}>
                      <Checkout />
                  </Elements>
              } />
              
              {/* --- The /purchase-book/:bookId route has been removed --- */}

            </Routes>
            <Footer />
          </>
        ) : (
          <div className='circle'>
            <CircularProgress />
            <h2>Loading....</h2>
          </div>
        )
      }
    </>
  );
}

export default App;