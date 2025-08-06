import React from 'react'
import { createRoutesFromChildren, Route, Navigate } from 'react-router-dom'
import Dashboard from "./component/dashboard"
import Billgenerator from './component/billgenerator'
import InventoryManager from "./component/inventorymanager"
import UserProtectedWrapper from './context/UserProtectedWrapper'
import ProductAnalysis from './component/ProductAnalysis'
import YourBills from './component/YourBills'
import Notifications from './component/Notifications'
import Profile from './component/Profile'
import Homepage from './component/Homepage'

const routes = createRoutesFromChildren(
    <>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<UserProtectedWrapper><Dashboard /></UserProtectedWrapper>} />
        <Route path="/billgenerator" element={<UserProtectedWrapper><Billgenerator/></UserProtectedWrapper>} />
        <Route path="/inventorymanager" element={<UserProtectedWrapper><InventoryManager/></UserProtectedWrapper>} />
        <Route path="/product-analysis" element={<UserProtectedWrapper><ProductAnalysis/></UserProtectedWrapper>} />
        <Route path="/bills" element={<UserProtectedWrapper><YourBills/></UserProtectedWrapper>} />
        <Route path="/notifications" element={<UserProtectedWrapper><Notifications/></UserProtectedWrapper>} />
        <Route path="/profile" element={<UserProtectedWrapper><Profile/></UserProtectedWrapper>} />
    </>
)

export default routes