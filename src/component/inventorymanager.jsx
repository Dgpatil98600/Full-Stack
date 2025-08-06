import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

function InventoryManager() {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        displayName: '',
        sku: '',
        category: '',
        actualPrice: '',
        sellingPrice: '',
        quantity: '',
        reorderLevel: '',
        supplier: '',
        expirationDate: '',
        notify: '',
    });
    const [quantityUpdate, setQuantityUpdate] = useState({
        sku: '',
        name: '',
        displayName: '',
        quantity: '',
        actualPrice: '',
        sellingPrice: '',
        reorderLevel: '',
        notify: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        axiosInstance.get('/api/inventory/list')
            .then(response => {
                console.log('Fetched products with notify data:', response.data);
                setProducts(response.data);
            })
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    const getCurrentDate = () => new Date().toLocaleDateString();

    const addProduct = () => {
        if (!newProduct.displayName || newProduct.displayName.trim() === "") {
            alert("Display Name is required.");
            return;
        }
        const productWithDate = {
            ...newProduct,
            dateAdded: getCurrentDate(),
            notify: newProduct.notify,
        };

        console.log('Adding product with data:', productWithDate);

        axiosInstance.post('/api/inventory/add', productWithDate)
            .then(response => {
                setProducts([...products, response.data]);
                setNewProduct({
                    name: '',
                    displayName: '',
                    sku: '',
                    category: '',
                    actualPrice: '',
                    sellingPrice: '',
                    quantity: '',
                    reorderLevel: '',
                    supplier: '',
                    expirationDate: '',
                    notify: '',
                });
            })
            .catch(error => {
                alert('Error adding product: ' + (error.response?.data?.message || error.message));
                console.error('Error adding product:', error);
            });
    };

    const updateQuantity = () => {
        const { sku, name, displayName, quantity, actualPrice, sellingPrice, reorderLevel, notify } = quantityUpdate;
        const updatedProduct = {
            name,
            displayName,
            quantity: parseInt(quantity),
            actualPrice: parseFloat(actualPrice),
            sellingPrice: parseFloat(sellingPrice),
            reorderLevel: parseInt(reorderLevel),
            notify,
            dateUpdated: new Date().toLocaleDateString(),
        };
    
        console.log('Updating product with data:', updatedProduct);
        const encodedSku = encodeURIComponent(sku);

        axiosInstance.put(`/api/inventory/update-product/${encodedSku}`, updatedProduct)
            .then(response => {
                if (parseInt(quantity) === 0) {
                    return axiosInstance.delete(`/api/notifications/delete-by-product/${response.data._id}`)
                        .then(() => response.data)
                        .catch(error => {
                            console.error('Error deleting notifications:', error);
                            return response.data;
                        });
                }
                return response.data;
            })
            .then(updatedProductData => {
                setProducts(products.map(product =>
                    product.sku === updatedProductData.sku ? updatedProductData : product
                ));
                setQuantityUpdate({
                    sku: '',
                    name: '',
                    displayName: '',
                    quantity: '',
                    actualPrice: '',
                    sellingPrice: '',
                    reorderLevel: '',
                    notify: '',
                });
            })
            .catch(error => {
                alert('Error updating product: ' + (error.response?.data?.message || error.message));
                console.error('Error updating product:', error);
            });
    };
    
    const deleteProduct = (sku) => {
        const encodedSku = encodeURIComponent(sku);
        axiosInstance.delete(`/api/inventory/delete/${encodedSku}`)
            .then(() => {
                setProducts(products.filter(product => product.sku !== sku));
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                alert('Failed to delete product. Please try again.');
            });
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedByCategory = filteredProducts.reduce((acc, product) => {
        const category = product.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = {};
        }
        
        const displayName = (product.displayName || 'Uncategorized').trim().toUpperCase();
        if (!acc[category][displayName]) {
            acc[category][displayName] = { displayName: product.displayName || 'Uncategorized', products: [] };
        }
        acc[category][displayName].products.push(product);
        return acc;
    }, {});

    return (
        <div className="p-6 font-sans">
            <h1 className="text-2xl font-bold mb-4">Inventory Manager</h1>

            <div className="mb-6">
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded"
                />
            </div>

            <div className="mb-8 p-4 border border-gray-300 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
                <form>
                    <input 
                        type="text" 
                        placeholder="Name" 
                        value={newProduct.name} 
                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Display Name" 
                        value={newProduct.displayName} 
                        onChange={e => setNewProduct({ ...newProduct, displayName: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="SKU" 
                        value={newProduct.sku} 
                        onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Category" 
                        value={newProduct.category} 
                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="number" 
                        placeholder="Actual Price" 
                        value={newProduct.actualPrice} 
                        onChange={e => setNewProduct({ ...newProduct, actualPrice: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Selling Price" 
                        value={newProduct.sellingPrice} 
                        onChange={e => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Quantity" 
                        value={newProduct.quantity} 
                        onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Reorder Level" 
                        value={newProduct.reorderLevel} 
                        onChange={e => setNewProduct({ ...newProduct, reorderLevel: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Supplier" 
                        value={newProduct.supplier} 
                        onChange={e => setNewProduct({ ...newProduct, supplier: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="date" 
                        placeholder="Expiration Date" 
                        value={newProduct.expirationDate} 
                        onChange={e => setNewProduct({ ...newProduct, expirationDate: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="number" 
                        placeholder="Notify Before (in days)" 
                        value={newProduct.notify} 
                        onChange={e => setNewProduct({ ...newProduct, notify: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                    />

                    <button 
                        type="button" 
                        onClick={addProduct} 
                        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Product
                    </button>
                </form>
            </div>

            <div className="mb-8 p-4 border border-gray-300 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Update Product</h2>
                <form>
                    <input 
                        type="text" 
                        placeholder="SKU" 
                        value={quantityUpdate.sku} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, sku: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Name" 
                        value={quantityUpdate.name} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, name: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Display Name" 
                        value={quantityUpdate.displayName} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, displayName: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                    />
                    <input 
                        type="number" 
                        placeholder="Quantity" 
                        value={quantityUpdate.quantity} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, quantity: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Actual Price" 
                        value={quantityUpdate.actualPrice} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, actualPrice: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Selling Price" 
                        value={quantityUpdate.sellingPrice} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, sellingPrice: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Reorder Level" 
                        value={quantityUpdate.reorderLevel} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, reorderLevel: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                        required
                    />
                    <input 
                        type="number" 
                        placeholder="Notify Before (in days)" 
                        value={quantityUpdate.notify} 
                        onChange={e => setQuantityUpdate({ ...quantityUpdate, notify: e.target.value })} 
                        className="w-full p-2 mb-2 border border-gray-300 rounded"
                    />
                
                    <button 
                        type="button" 
                        onClick={updateQuantity} 
                        className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Update Product
                    </button>
                </form>
            </div>

            <div className="p-4 border border-gray-300 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Product List</h2>
                {Object.entries(groupedByCategory).map(([category, groups]) => (
                    <div key={category} className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-purple-700 bg-purple-50 p-3 rounded-lg">{category}</h2>
                        {Object.values(groups).map(group => (
                            <div key={group.displayName} className="mb-6 ml-4">
                                <h3 className="text-lg font-bold mb-2 bg-gray-100 p-2 rounded">{group.displayName}</h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 border-b">Name</th>
                                            <th className="p-2 border-b">SKU</th>
                                            <th className="p-2 border-b">Category</th>
                                            <th className="p-2 border-b">Actual Price</th>
                                            <th className="p-2 border-b">Selling Price</th>
                                            <th className="p-2 border-b">Quantity</th>
                                            <th className="p-2 border-b">Reorder Level</th>
                                            <th className="p-2 border-b">Supplier</th>
                                            <th className="p-2 border-b">Expiration Date</th>
                                            <th className="p-2 border-b">Date Added</th>
                                            <th className="p-2 border-b">Notify Days</th>
                                            <th className="p-2 border-b">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.products.map(product => (
                                            <tr key={product.sku} className="border-b">
                                                <td className="p-2">{product.name}</td>
                                                <td className="p-2">{product.sku}</td>
                                                <td className="p-2">{product.category}</td>
                                                <td className="p-2">{product.actualPrice}</td>
                                                <td className="p-2">{product.sellingPrice}</td>
                                                <td className="p-2">{product.quantity}</td>
                                                <td className="p-2">{product.reorderLevel}</td>
                                                <td className="p-2">{product.supplier}</td>
                                                <td className="p-2">{product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : '-'}</td>
                                                <td className="p-2">{new Date(product.dateAdded).toLocaleDateString()}</td>
                                                <td className="p-2">{product.notify ? product.notify : '-'}</td>
                                                <td className="p-2">
                                                    <button 
                                                        onClick={() => deleteProduct(product.sku)} 
                                                        className="text-red-500 hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default InventoryManager;