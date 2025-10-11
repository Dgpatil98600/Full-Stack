// routes/shop-analysis.js
import express from "express";
import Bill from "../models/Bill.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("Shop analysis route HIT");
  try {
    const userId = req.user.id;
    console.log("User ID:", userId);
    // Get the month parameter for daily stats
    const monthParam = req.query.month;
    let startDate, endDate;
    
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // Last day of the month
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
    }

    // Initialize daily stats
    const dailyStats = {};
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyStats[dateStr] = { date: dateStr, sales: 0, profit: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // // Match ProductAnalysis "all" baseline so a request to product-analysis?range=all covers same bills
    // const from = new Date("1950-01-01");

    // // Fetch bills in the same way ProductAnalysis does for 'all'
    // const bills = await Bill.find({ user: userId, date: { $gte: from } });
    // console.log("Bills found:", bills.length);

    // // Fetch all products (for remaining stock calc) — keep existing behavior
    // const allProducts = await Product.find({ user: userId });
    // console.log("Total products (for stock):", allProducts.length);

    // // Build the set of product IDs that actually appear in the bills
    // const productIdSet = new Set();
    // for (const bill of bills) {
    //   for (const item of bill.items || []) {
    //     const pid = item.productId || (item._doc && item._doc.productId);
    //     if (pid) productIdSet.add(String(pid));
    //   }
    // }
    // const productIds = Array.from(productIdSet);

    // // Fetch only the products referenced in bills (same as ProductAnalysis)
    // const productsUsed = await Product.find({ _id: { $in: productIds }, user: userId });
    // console.log("Products found (used in bills):", productsUsed.length);

    // // Build product lookup map (for fallbacks)
    // const productMap = {};
    // productsUsed.forEach(p => {
    //   productMap[String(p._id)] = {
    //     displayName: p.displayName,
    //     category: p.category
    //     // Removed prices as we'll use values from bills
    //   };
    // });

    // let profit = 0;
    // let processedItems = 0;
    // let skippedItems = 0;

    // for (const bill of bills) {
    //   for (let it = 0; it < (bill.items || []).length; it++) {
    //     const item = bill.items[it];

    //     const prodId = item.productId || (item._doc && item._doc.productId);
    //     if (!prodId) {
    //       skippedItems++;
    //       continue;
    //     }

    //     const prod = productMap[String(prodId)];
    //     if (!prod) {
    //       skippedItems++;
    //       continue;
    //     }

    //     // Updated to handle both old and new bill structures
        // const quantity = Number(
        //     item.quantity ?? 
        //     (item._doc && item._doc.quantity) ?? 
        //     0
        // );
        
        // const actualPrice = Number(
        //     item.actualPrice ?? 
        //     (item._doc && item._doc.actualPrice) ?? 
        //     0
        // );
        
        // const sellingPrice = Number(
        //     item.sellingPrice ?? 
        //     (item._doc && item._doc.sellingPrice) ?? 
        //     item.price ?? 
        //     (item._doc && item._doc.price) ?? 
        //     0
        // );

    //     if (isNaN(sellingPrice) || isNaN(actualPrice) || isNaN(quantity) || quantity === 0) {
    //       skippedItems++;
    //       continue;
    //     }

    //     profit += (sellingPrice - actualPrice) * quantity;
    //     processedItems++;
    //   }
    // }

    let profit = 0;
    let remaining_stock = 0;
    let final_gain = 0;

    // Get all products and bills
    const products = await Product.find({ user: userId });
    const bills = await Bill.find({ user: userId });
    
    console.log('Found bills:', bills.length, 'products:', products.length);

    // Calculate profit from all bills (regardless of date)
    for (const bill of bills) {
        console.log('Processing bill:', bill._id, 'with items:', bill.items?.length);
        for (const item of bill.items || []) {
            // Log the raw item data
            console.log('Processing item:', {
                quantity: item.quantity,
                actualPrice: item.actualPrice,
                sellingPrice: item.sellingPrice
            });
            
            // Ensure we have all required values and they are valid numbers
            const quantity = Number(item.quantity);
            const actualPrice = Number(item.actualPrice);
            const sellingPrice = Number(item.sellingPrice);
            
            if (!isNaN(quantity) && !isNaN(actualPrice) && !isNaN(sellingPrice) && quantity > 0) {
                const itemProfit = (sellingPrice - actualPrice) * quantity;
                profit += itemProfit;
                console.log('Item profit calculated:', {
                    quantity,
                    actualPrice,
                    sellingPrice,
                    itemProfit
                });
            } else {
                console.log('Skipped invalid item:', {
                    hasQuantity: item.quantity !== undefined,
                    hasActualPrice: item.actualPrice !== undefined,
                    hasSellingPrice: item.sellingPrice !== undefined,
                    parsedQuantity: quantity,
                    parsedActualPrice: actualPrice,
                    parsedSellingPrice: sellingPrice
                });
            }
        }
    }

    // Calculate remaining_stock and final_gain from current inventory
    for (const p of products) {
        if (p.quantity != 0 && p.actualPrice != undefined && p.sellingPrice != undefined) {
            const ap = Number(p.actualPrice);
            const qty = Number(p.quantity);    
            const sp = Number(p.sellingPrice);

            if (!isNaN(ap) && !isNaN(qty) && !isNaN(sp)) {
                remaining_stock += ap * qty;
                final_gain += (sp - ap) * qty;
            }
        }
    }

    // Calculate daily stats only for the selected month
    for (const bill of bills) {
        const billDate = new Date(bill.date);
        if (billDate >= startDate && billDate <= endDate) {
            const dateStr = billDate.toISOString().split('T')[0];
            if (dailyStats[dateStr]) {
                for (const item of bill.items || []) {
                    if(item.quantity != 0 && item.actualPrice != undefined && item.sellingPrice != undefined) {
                        const quantity = Number(item.quantity);
                        const actualPrice = Number(item.actualPrice);
                        const sellingPrice = Number(item.sellingPrice);
                        
                        if (!isNaN(quantity) && !isNaN(actualPrice) && !isNaN(sellingPrice)) {
                            dailyStats[dateStr].sales += sellingPrice * quantity;
                            dailyStats[dateStr].profit += (sellingPrice - actualPrice) * quantity;
                        }
                    }
                }
            }
        }
    }

    console.log('Calculated values:', {
        profit,
        remaining_stock,
        final_gain,
        dailyStats: Object.values(dailyStats)
    });
    // let remaining_stock = 0;
    // let final_gain  = 0;
    // for (const p of allProducts) {
    //   const ap = Number(p.actualPrice ?? 0);

    //   const qty = Number(p.quantity ?? 0);
    //   if (!Number.isNaN(ap) && !Number.isNaN(qty)) {
    //     remaining_stock += ap * qty;
    //     final_gain += (Number(p.sellingPrice) - ap) * qty;
    //   }
    // }

    const turnOver = profit - remaining_stock;

    //console.log(`ShopAnalysis result -> profit: ${profit}, processedItems: ${processedItems}, skippedItems: ${skippedItems}`);

    res.json({
      success: true,
      profit,
      remaining_stock,
      turnOver,
      final_gain,
      dailyStats: Object.values(dailyStats)
    });
  } catch (error) {
    console.error("Shop analysis error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
