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

    useEffect(() => {
        axiosInstance.get('/api/inventory/list')
            .then(response => setProducts(response.data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    const addItem = (productId, quantity) => {
        const product = products.find(p => p._id === productId);
        if (product) {
            setItems([...items, {
                productId: product._id,
                productName: product.name,
                quantity,
                price: product.sellingPrice,
                total: product.sellingPrice * quantity
            }]);
        }
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
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
            price: item.price,
            total: item.total
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
            console.error('Error creating bill:', error);
            setErrors([error.response?.data?.error || 'Failed to create bill']);
        });
    };

    const handlePrint = useReactToPrint({
        content: () => billRef.current,
    });

    const saveAsPDF = () => {
        const doc = new jsPDF();
        doc.text("Bill Details", 10, 10);
        doc.text(`Customer Name: ${bill.customerName}, 10, 20`);
        doc.text(`Bill Number: ${bill.billNumber}, 10, 30`);
        doc.text(`Date: ${new Date(bill.date).toLocaleDateString()}, 10, 40`);

        let yOffset = 50;
        bill.items.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.productName} - Quantity: ${item.quantity} - Price: ₹${item.price.toFixed(2)} - Total: ₹${item.total.toFixed(2)}, 10, yOffset`);
            yOffset += 10;
        });

        doc.text(`Grand Total: ₹${bill.grandTotal.toFixed(2)}, 10, yOffset + 10`);
        doc.text(`Net Quantity: ${bill.netQuantity}, 10, yOffset + 20`);

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
                <div className="flex space-x-2 mb-2">
                    <select
                        onChange={e => addItem(e.target.value, parseFloat(document.getElementById('quantity').value) || 1)}
                        className="border p-2 rounded w-full"
                    >
                        <option value="">Select Product</option>
                        {products.map(product => (
                            <option key={product._id} value={product._id}>
                                {product.name} - ₹{product.sellingPrice}
                            </option>
                        ))}
                    </select>
                    <input
                        id="quantity"
                        type="number"
                        step="0.01" 
                        min="0.01"
                        placeholder="Quantity"
                        className="border p-2 rounded w-full"
                    />
                </div>
                <button
                    onClick={() => addItem(document.querySelector('select').value, parseFloat(document.getElementById('quantity').value) || 1)}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                    Add Product
                </button>
            </div>

            <div className="mb-4">
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
                                    <td className="border p-2">{item.quantity}</td>
                                    <td className="border p-2">₹{item.price.toFixed(2)}</td>
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
                                        <td className="border p-2">₹{item.price.toFixed(2)}</td>
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