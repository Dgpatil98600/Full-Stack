import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axios';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';

function BillGenerator() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [bill, setBill] = useState(null);
  const [errors, setErrors] = useState([]);
  const billRef = useRef();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    axiosInstance.get('/api/inventory/list')
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => console.error('Error fetching products:', error));
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearchDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchRef]);

  const addItem = (product) => {
    if (product) {
      // By default sellingPrice and quantity
      setItems([...items, {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        displayName: product.displayName,
        category: product.category,
        actualPrice: product.actualPrice,
        sellingPrice: product.sellingPrice,
        total: product.sellingPrice * 1,
      }]);
      setSearchTerm('');
      setIsSearchDropdownOpen(false);
    } else {
      setErrors(['Please select a valid product.']);
    }
  };

  const handleProductSelect = (product) => {
    // Directly add with default quantity 1 and product price
    addItem(product);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleQuantityChange = (index, newQuantity) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        const quantity = Math.max(1, parseInt(newQuantity) || 1);
        return { ...item, quantity, total: item.sellingPrice * quantity };
      }
      return item;
    });
    setItems(newItems);
  };

  const handlePriceChange = (index, newPrice) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        const price = Math.max(0, parseFloat(newPrice) || 0);
        return { ...item, sellingPrice: price, total: price * item.quantity };
      }
      return item;
    });
    setItems(newItems);
  };

  const createBill = () => {
    if (!customerName || items.length === 0) {
      setErrors(['Customer name and at least one item are required.']);
      return;
    }
    setErrors([]);
    const itemsWithProductId = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      displayName: item.displayName,
      category: item.category,
      actualPrice: item.actualPrice,
      sellingPrice: item.sellingPrice,
      total: item.total,
    }));
    axiosInstance.post('/api/bill/create', {
      customerName,
      items: itemsWithProductId
    })
      .then(response => {
        if (!response.data || !response.data.bill) {
          throw new Error('Invalid response from server');
        }
        const billData = {
          ...response.data.bill,
          items: response.data.bill.items || itemsWithProductId
        };
        setBill(billData);
        setItems([]);
        setCustomerName('');
        alert('Bill created successfully');
      })
      .catch(error => {
        setErrors([error.response?.data?.error || 'Failed to create bill']);
      });
  };

  const handlePrint = useReactToPrint({
    content: () => billRef.current,
  });

  const saveAsPDF = () => {
    const doc = new jsPDF();
    doc.text("Bill Details", 10, 10);
    doc.text(`Customer Name: ${bill.customerName}`, 10, 20);
    doc.text(`Bill Number: ${bill.billNumber}`, 10, 30);
    doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}`, 10, 40);
    let yOffset = 50;
    bill.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.productName} - Quantity: ${item.quantity} - Price: ₹${item.sellingPrice.toFixed(2)} - Total: ₹${item.total.toFixed(2)}`, 10, yOffset);
      yOffset += 10;
    });
    doc.text(`Grand Total: ₹${bill.grandTotal.toFixed(2)}`, 10, yOffset + 10);
    doc.text(`Net Quantity: ${bill.netQuantity}`, 10, yOffset + 20);
    doc.save('bill.pdf');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-white shadow-md rounded">
      <h1 className="text-2xl font-bold mb-4">Bill Generator</h1>
      {errors.length > 0 && (
        <div className="bg-red-200 text-red-700 p-2 rounded mb-4">
          {errors.join(', ')}
        </div>
      )}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Add Item</h2>
        <div className="relative mb-2" ref={searchRef}>
          <input
            type="text"
            placeholder="Search or Select Product"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchDropdownOpen(true)}
            className="border p-2 rounded w-full"
          />
          {isSearchDropdownOpen && searchResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto">
              {searchResults.map(product => (
                <li
                  key={product._id}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleProductSelect(product)}
                >
                  {product.name} - ₹{product.sellingPrice}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mb-4 mt-4">
        <h2 className="text-xl font-semibold mb-2">Items</h2>
        {items.length > 0 ? (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Product Name</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleQuantityChange(index, e.target.value)}
                      className="border rounded p-1 w-16 text-center"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.sellingPrice}
                      onChange={e => handlePriceChange(index, e.target.value)}
                      className="border rounded p-1 w-24 text-center"
                    />
                  </td>
                  <td className="border p-2">₹{item.total.toFixed(2)}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => removeItem(index)}
                      className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items added yet.</p>
        )}
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span className="font-bold">Grand Total:</span>
        <span>₹{items.reduce((acc, item) => acc + item.total, 0).toFixed(2)}</span>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span className="font-bold">Total Products:</span>
        <span>{items.length}</span>
      </div>
      <button
        onClick={createBill}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Generate Bill
      </button>
      {bill && bill.items && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <div ref={billRef}>
            <h2 className="text-xl font-bold mb-2">Bill Details</h2>
            <p><strong>Customer Name:</strong> {bill.customerName}</p>
            <p><strong>Bill Number:</strong> {bill.billNumber}</p>
            <p><strong>Date:</strong> {new Date(bill.date).toLocaleDateString()}</p>
            <h3 className="text-lg font-semibold mt-2">Items</h3>
            <table className="w-full table-auto border-collapse mt-2">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Product Name</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">{item.productName}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">₹{item.sellingPrice.toFixed(2)}</td>
                    <td className="border p-2">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2">
              <p><strong>Grand Total:</strong> ₹{bill.grandTotal.toFixed(2)}</p>
              <p><strong>Net Quantity:</strong> {bill.netQuantity}</p>
              <p className="text-green-600 mt-2">Thank you for your visit. Have a great day!</p>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handlePrint}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Print Bill
            </button>
            <button
              onClick={saveAsPDF}
              className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
            >
              Save as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillGenerator;
