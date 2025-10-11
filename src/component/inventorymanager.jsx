import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function InventoryManager() {
    const [products, setProducts] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [editingProduct, setEditingProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [addingToGroup, setAddingToGroup] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(null);
    
    // NEW STATE for the category-level add form
    const [addingToCategory, setAddingToCategory] = useState(null);


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
    
    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        axiosInstance.get('/api/inventory/list')
            .then(response => {
                console.log('Fetched products with notify data:', response.data);
                setProducts(response.data);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                toast.error('Failed to fetch products. Please try again later.');
            });
    }, []);


    const getCurrentDate = () => new Date().toLocaleDateString();
    const toggleGroup = (category, displayName) => {
        const key = `${category}-${displayName}`;
        setExpandedGroups(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };


    const startEdit = (product) => {
        setEditingProduct(product.sku);
        setEditFormData({
            name: product.name,
            displayName: product.displayName,
            actualPrice: product.actualPrice,
            sellingPrice: product.sellingPrice,
            quantity: product.quantity,
            reorderLevel: product.reorderLevel,
            supplier: product.supplier,
            notify: product.notify
        });
    };


    // Cancel editing
    const cancelEdit = () => {
        setEditingProduct(null);
        setEditFormData({});
    };


    // Save edit with confirmation modal
    const saveEdit = () => {
        setShowConfirmModal({
            type: 'update',
            action: () => performUpdate()
        });
    };


    const performUpdate = () => {
        const updatedProduct = {
            name: editFormData.name,
            displayName: editFormData.displayName,
            quantity: parseInt(editFormData.quantity),
            actualPrice: parseFloat(editFormData.actualPrice),
            sellingPrice: parseFloat(editFormData.sellingPrice),
            reorderLevel: parseInt(editFormData.reorderLevel),
            supplier: editFormData.supplier,
            notify: editFormData.notify,
            dateUpdated: getCurrentDate(),
        };


        const encodedSku = encodeURIComponent(editingProduct);
        axiosInstance.put(`/api/inventory/update-product/${encodedSku}`, updatedProduct)
            .then(response => {
                setProducts(products.map(product =>
                    product.sku === response.data.sku ? response.data : product
                ));
                cancelEdit();
                setShowConfirmModal(null);
                toast.success("Product updated successfully!");
            })
            .catch(error => {
                const errorMessage = error.response?.data?.message || error.message;
                toast.error(`Error updating product: ${errorMessage}`);
                setShowConfirmModal(null);
            });
    };
    
    // Original startAddToGroup for the button inside each displayName group
    const startAddToGroup = (category, displayName) => {
        setAddingToGroup(`${category}-${displayName}`);
        setNewProduct({
            name: '',
            displayName: displayName,
            sku: '',
            category: category,
            actualPrice: '',
            sellingPrice: '',
            quantity: '',
            reorderLevel: '',
            supplier: '',
            expirationDate: '',
            notify: '',
        });
    };

    // NEW FUNCTION for the category-level button
    const startAddToCategory = (category) => {
        setAddingToCategory(category);
        setNewProduct({
            name: '',
            displayName: '',
            sku: '',
            category: category,
            actualPrice: '',
            sellingPrice: '',
            quantity: '',
            reorderLevel: '',
            supplier: '',
            expirationDate: '',
            notify: '',
        });
    };


    // Combined cancel add function
    const cancelAdd = () => {
        setAddingToGroup(null);
        setAddingToCategory(null);
        setNewProduct({});
    };


    const addProduct = () => {
        if (!newProduct.displayName || newProduct.displayName.trim() === "") {
            toast.error("Display Name is required.");
            return;
        }
        if (!newProduct.sku || newProduct.sku.trim() === "") {
            toast.error("SKU is required.");
            return;
        }


        const productWithDate = {
            ...newProduct,
            dateAdded: getCurrentDate(),
        };


        axiosInstance.post('/api/inventory/add', productWithDate)
            .then(response => {
                setProducts([...products, response.data]);
                cancelAdd();
                toast.success("Product added successfully!");
            })
            .catch(error => {
                const errorMessage = error.response?.data?.message || error.message;
                toast.error(`Error adding product: ${errorMessage}`);
            });
    };
    
    const deleteProduct = (sku) => {
        const encodedSku = encodeURIComponent(sku);
        axiosInstance.delete(`/api/inventory/delete/${encodedSku}`)
            .then(() => {
                setProducts(products.filter(product => product.sku !== sku));
                toast.success("Product deleted successfully!");
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                toast.error('Failed to delete product. Please try again.');
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


            <div className="p-4 border border-gray-300 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Product List</h2>
                {Object.entries(groupedByCategory).map(([category, groups]) => {
                    const isAddingToThisCategory = addingToCategory === category;

                    return (
                        <div key={category} className="mb-8">
                            <div className='flex justify-between items-center mb-4'>
                                <h2 className="text-2xl font-bold mb-4 text-purple-700 bg-purple-50 p-3 rounded-lg">{category}</h2>
                                <div className="mb-4">
                                    {/* NEW BUTTON for adding a product at the category level */}
                                    <button 
                                        onClick={() => startAddToCategory(category)} 
                                        className='bg-blue-800 text-xl text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                                    >
                                        Add New Product
                                    </button>
                                </div>
                            </div>
                            {Object.values(groups).map(group => {
                                const key = `${category}-${group.displayName}`;
                                const isExpanded = expandedGroups[key];
                                const isAddingHere = addingToGroup === key;


                                return (
                                    <div key={group.displayName} className="mb-1 ml-4">
                                        <button 
                                            onClick={() => toggleGroup(category, group.displayName)}
                                            className="flex items-center text-lg font-bold bg-gray-100 p-2 rounded w-full text-left"
                                        >
                                            <span className="mr-2">
                                                {isExpanded ? '▼' : '▶'}
                                            </span>
                                            {group.displayName}
                                        </button>


                                        {isExpanded && (
                                            <>
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50">
                                                            <th className="p-2 border-b">SKU</th>
                                                            <th className="p-2 border-b">Name</th>
                                                            <th className='p-2 border-b'>DisplayName</th> 
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
                                                        {group.products.map(product => {
                                                            const isEditing = editingProduct === product.sku;
                                                            
                                                            if (isEditing) {
                                                                return (
                                                                    <tr key={product.sku} className="border-b bg-blue-50">
                                                                        <td className="p-2 bg-gray-100">{product.sku}</td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="text" 
                                                                                value={editFormData.name}
                                                                                onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="text" 
                                                                                value={editFormData.displayName}
                                                                                onChange={e => setEditFormData({...editFormData, displayName: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2 bg-gray-100">{product.category}</td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="number" 
                                                                                value={editFormData.actualPrice}
                                                                                onChange={e => setEditFormData({...editFormData, actualPrice: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="number" 
                                                                                value={editFormData.sellingPrice}
                                                                                onChange={e => setEditFormData({...editFormData, sellingPrice: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="number" 
                                                                                value={editFormData.quantity}
                                                                                onChange={e => setEditFormData({...editFormData, quantity: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="number" 
                                                                                value={editFormData.reorderLevel}
                                                                                onChange={e => setEditFormData({...editFormData, reorderLevel: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="text" 
                                                                                value={editFormData.supplier}
                                                                                onChange={e => setEditFormData({...editFormData, supplier: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2 bg-gray-100">{product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : '-'}</td>
                                                                        <td className="p-2 bg-gray-100">{new Date(product.dateAdded).toLocaleDateString()}</td>
                                                                        <td className="p-2">
                                                                            <input 
                                                                                type="number" 
                                                                                value={editFormData.notify}
                                                                                onChange={e => setEditFormData({...editFormData, notify: e.target.value})}
                                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <button 
                                                                                onClick={saveEdit}
                                                                                className="text-green-500 hover:underline mr-2"
                                                                            >
                                                                                Update
                                                                            </button>
                                                                            <button 
                                                                                onClick={cancelEdit}
                                                                                className="text-gray-500 hover:underline mr-2"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => deleteProduct(product.sku)}
                                                                                className="text-red-500 hover:underline"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }


                                                            return (
                                                                <tr key={product.sku} className="border-b">
                                                                    <td className="p-2">{product.sku}</td>
                                                                    <td className="p-2">{product.name}</td>
                                                                    <td className='p-2'>{product.displayName}</td>
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
                                                                            onClick={() => startEdit(product)}
                                                                            className="text-blue-500 hover:underline mr-2"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => deleteProduct(product.sku)}
                                                                            className="text-red-500 hover:underline"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}


                                                        {/* Add product form row */}
                                                        {isAddingHere && (
                                                            <tr className="border-b bg-green-50">
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="SKU"
                                                                        value={newProduct.sku}
                                                                        onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Name"
                                                                        value={newProduct.name}
                                                                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Display Name"
                                                                        value={newProduct.displayName}
                                                                        onChange={e => setNewProduct({...newProduct, displayName: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2 bg-gray-100">{category}</td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="Actual Price"
                                                                        value={newProduct.actualPrice}
                                                                        onChange={e => setNewProduct({...newProduct, actualPrice: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="Selling Price"
                                                                        value={newProduct.sellingPrice}
                                                                        onChange={e => setNewProduct({...newProduct, sellingPrice: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="Quantity"
                                                                        value={newProduct.quantity}
                                                                        onChange={e => setNewProduct({...newProduct, quantity: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="Reorder Level"
                                                                        value={newProduct.reorderLevel}
                                                                        onChange={e => setNewProduct({...newProduct, reorderLevel: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Supplier"
                                                                        value={newProduct.supplier}
                                                                        onChange={e => setNewProduct({...newProduct, supplier: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="date" 
                                                                        value={newProduct.expirationDate}
                                                                        onChange={e => setNewProduct({...newProduct, expirationDate: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2 bg-gray-100">-</td>
                                                                <td className="p-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="Notify Days"
                                                                        value={newProduct.notify}
                                                                        onChange={e => setNewProduct({...newProduct, notify: e.target.value})}
                                                                        className="w-full p-1 border border-gray-300 rounded"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <button 
                                                                        onClick={addProduct}
                                                                        className="text-green-500 hover:underline mr-2"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={cancelAdd}
                                                                        className="text-gray-500 hover:underline"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>


                                                {/* Add button - only shows when not currently adding */}
                                                {!isAddingHere && (
                                                    <div className="mt-3">
                                                        <button 
                                                            onClick={() => startAddToGroup(category, group.displayName)}
                                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                        >
                                                            Add Product
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* NEW ADD PRODUCT FORM at the end of the category table */}
                            {isAddingToThisCategory && (
                                <table className="w-full border-collapse mt-4">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-2 border-b">SKU</th>
                                            <th className="p-2 border-b">Name</th>
                                            <th className='p-2 border-b'>DisplayName</th> 
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
                                        <tr className="border-b bg-green-50">
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="SKU"
                                                    value={newProduct.sku}
                                                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Name"
                                                    value={newProduct.name}
                                                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Display Name"
                                                    value={newProduct.displayName}
                                                    onChange={e => setNewProduct({...newProduct, displayName: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2 bg-gray-100">{category}</td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Actual Price"
                                                    value={newProduct.actualPrice}
                                                    onChange={e => setNewProduct({...newProduct, actualPrice: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Selling Price"
                                                    value={newProduct.sellingPrice}
                                                    onChange={e => setNewProduct({...newProduct, sellingPrice: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Quantity"
                                                    value={newProduct.quantity}
                                                    onChange={e => setNewProduct({...newProduct, quantity: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Reorder Level"
                                                    value={newProduct.reorderLevel}
                                                    onChange={e => setNewProduct({...newProduct, reorderLevel: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Supplier"
                                                    value={newProduct.supplier}
                                                    onChange={e => setNewProduct({...newProduct, supplier: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="date" 
                                                    value={newProduct.expirationDate}
                                                    onChange={e => setNewProduct({...newProduct, expirationDate: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2 bg-gray-100">-</td>
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    placeholder="Notify Days"
                                                    value={newProduct.notify}
                                                    onChange={e => setNewProduct({...newProduct, notify: e.target.value})}
                                                    className="w-full p-1 border border-gray-300 rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <button 
                                                    onClick={addProduct}
                                                    className="text-green-500 hover:underline mr-2"
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={cancelAdd}
                                                    className="text-gray-500 hover:underline"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    );
                })}
            </div>


            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg border border-gray-300 shadow-lg p-6 w-96 text-center">
                        <p className="text-lg mb-4">
                            {showConfirmModal.type === 'update' ? 'Confirm update?' : 'Confirm delete?'}
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={showConfirmModal.action}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                OK
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(null)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}


export default InventoryManager;