 import React from 'react'
 import Carousel from 'react-material-ui-carousel'
 import "./banner.css";
 import amazonBanner from '../../assets/great indian sale.jpg'; 
 import iphone from '../../assets/iphone.png'; 
 import laptop from '../../assets/laptop.jpg'; 

 const data = [
  amazonBanner,
  iphone,
  laptop
]
 
 const Banner = () => {
   return (
     <Carousel
     className='carasousel'
     autoPlay={true}
     animation='slide'
     indicators={false}
     navButtonsAlwaysVisible={true}
     cycleNavigation={true}
     navButtonsProps={{
       style:{
        backgroundcolor:"#fff",
        color:"#494949",
        borderRadius:0,
        marginTop:-22,
        height:"104px"
       }
     }}>
      {
        data.map((imag,i)=>{
           return (
            <>
               <img key={i} src={imag} alt="banner" className='banner_img'/>
            </>
           )
        })
      }
        
     </Carousel>
   )
 }
 
 export default Banner
 