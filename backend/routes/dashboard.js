const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/orders.json');

function getOrders() {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

router.get('/stats', (req, res) => {
  try {
    const orders = getOrders();
    let stats = {
      financial: { totalRevenue: 0, totalCost: 0, totalProfit: 0, profitMargin: 0, revenueChange: 15.0 },
      orders: { total: orders.length, active: 0, completed: 0, pending: 0, draft: 0 },
      topClients: [], recentOrders: []
    };
    orders.forEach(order => {
      const clientPrice = parseFloat(order.clientPrice || order.klKaina || 0);
      const carrierPrice = parseFloat(order.carrierPrice || order.vezKaina || 0);
      stats.financial.totalRevenue += clientPrice;
      stats.financial.totalCost += carrierPrice;
      stats.financial.totalProfit += (clientPrice - carrierPrice);
      const status = (order.status || '').toLowerCase();
      if (status === 'aktyvus' || status === 'active') stats.orders.active++;
      else if (status === 'baigtas' || status === 'completed') stats.orders.completed++;
    });
    if (stats.financial.totalRevenue > 0) {
      stats.financial.profitMargin = (stats.financial.totalProfit / stats.financial.totalRevenue) * 100;
    }
    stats.financial.totalRevenue = Math.round(stats.financial.totalRevenue * 100) / 100;
    stats.financial.totalCost = Math.round(stats.financial.totalCost * 100) / 100;
    stats.financial.totalProfit = Math.round(stats.financial.totalProfit * 100) / 100;
    stats.financial.profitMargin = Math.round(stats.financial.profitMargin * 100) / 100;
    res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate stats' });
  }
});

module.exports = router;
