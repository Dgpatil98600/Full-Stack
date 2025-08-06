import { useNavigate } from "react-router-dom";
import React from 'react'


const card = (props) => {
  
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (props.title === 'Bill Generator') {
      navigate('/billgenerator');
    }else if(props.title==="Manage Products"){
        navigate("/inventorymanager");
    }else if(props.title==="Your Bills"){
        navigate('/bills');
    }else if(props.title==="Product Analysis"){
      navigate('/product-analysis');
    }
};



  return (
    <>
    <div className="card w-64 h-60 bg-slate-50 rounded-lg shadow-lg transform transition duration-500 hover:scale-105">
  <img
    src={props.image}
    alt={props.title}
    className="w-full h-40 object-cover rounded-t-lg"
  />
  <div className="p-4">
    <button
      onClick={handleCardClick}
      className="w-full text-white bg-blue-500 hover:bg-blue-600 p-2 rounded-lg shadow-md transition duration-300"
    >
      {props.title}
    </button>
  </div>
</div>

      
    </>
  );
};

export default card