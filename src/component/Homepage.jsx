import React, { useState } from 'react';
import Loginfrm from './Loginfrm';
import Registration from './Registration';

const HomePage = () => {
  const [modalType, setModalType] = useState(null);

  const openLoginModal = () => setModalType('login');
  const openRegisterModal = () => setModalType('register');
  const closeModal = () => setModalType(null);

  return (
    <div> 
      <header className="bg-gray-300 shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Inventory Management</h1>
        <div>
          <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md mr-2 hover:bg-blue-100" onClick={openLoginModal}>Log in</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={openRegisterModal}>Sign Up</button>
        </div>
      </header>
      
      <div className="text-center bg-gray-300 py-12">
        <h1 className="text-4xl font-bold text-gray-800">Inventory Management</h1>
        <h2 className="text-xl text-gray-600 mt-2">Manage your inventory efficiently with our advanced system.</h2>
        <p className="text-lg mt-4">Explore our features and see how we can streamline your inventory process.</p>
      </div>
      
      <div className="mt-6 hover:h-70 flex justify-center">
        <input type="text" placeholder="Search for inventory features..." className="w-1/2 p-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <section className="container mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <img src={design.image} alt={design.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <p className="text-lg font-semibold">{design.title}</p>
              <p className="text-gray-600">{design.author}</p>
            </div>
          </div>
        ))}
      </section>
 
      {modalType && (
        <div className="fixed inset-0 flex items-center h-1/2 mt-30 justify-center">
      
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-lg font-bold">{modalType === 'login' ? 'Login' : 'Sign Up'}</h5>
              <button className="text-black hover:text-gray-900" onClick={closeModal}>✖</button>
            </div>
            {modalType === 'login' ? <Loginfrm setModalType={setModalType} /> : <Registration setModalType={setModalType} />}
     
        </div>
      )}
    </div>
  );
};

const designs = [
  { image: 'https://c8.alamy.com/comp/2EB0XJH/inventory-management-inscription-coming-out-from-an-open-book-creative-business-concept-2EB0XJH.jpg', title: 'Online Store Management', author: 'By Jordan Hughes' },
  { image: 'https://t4.ftcdn.net/jpg/05/50/14/63/360_F_550146337_826DHUXoFx18MRTMUauX3fyRw9R7S1BO.jpg', title: 'Data Lake', author: 'By Balkan Brothers' },
  { image: 'https://www.geckoboard.com/uploads/Warehouse-dashboard-example.png', title: 'Attractive Dashboards', author: 'By Jordan Hughes' },
  { image: 'https://bidhee.com/uploads/work/2019-12-25-10-43-45-Inventory.svg', title: 'Manage your Inventory Easily', author: 'By Jordan Hughes' },
  { image: 'https://cdn.prod.website-files.com/60c8be6907ca4c27d498b57c/63adbaf6ee4d0251ccd24120_Dashboard-preview-image.svg', title: 'Stock Optimization', author: 'By Balkan Brothers' },
  { image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_Y58eriBBpIyo88TfsQQN0TjW-84wioxaew&s', title: 'Inventory Tracker', author: 'By Jordan Hughes' },
];

export default HomePage;
