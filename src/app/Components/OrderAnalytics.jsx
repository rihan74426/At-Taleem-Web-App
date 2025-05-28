"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import Loader from "./Loader";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function OrderAnalytics() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(
        `/api/orders/analytics?period=${period}&type=export`
      );
      if (!res.ok) throw new Error("Failed to export data");
      const data = await res.json();

      // Convert to CSV
      const headers = [
        "Order ID",
        "Date",
        "Status",
        "Payment Status",
        "Amount",
        "Customer Name",
        "Email",
        "Phone",
        "Address",
      ];

      const csvContent = [
        headers.join(","),
        ...data.map((order) =>
          [
            order.orderId,
            format(new Date(order.date), "yyyy-MM-dd"),
            order.status,
            order.paymentStatus,
            order.amount,
            order.customer.name,
            order.customer.email,
            order.customer.phone,
            order.deliveryAddress,
          ].join(",")
        ),
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${period}-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!analytics) return null;

  return (
    <div className="space-y-8 p-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{analytics.totalOrders}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold">{analytics.totalRevenue} BDT</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <h3 className="text-gray-500 text-sm">Average Order Value</h3>
          <p className="text-2xl font-bold">
            {Math.round(analytics.averageOrderValue)} BDT
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow"
        >
          <h3 className="text-gray-500 text-sm">Success Rate</h3>
          <p className="text-2xl font-bold">
            {Math.round(
              (analytics.statusDistribution.completed / analytics.totalOrders) *
                100
            )}
            %
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Trends */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM dd")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) =>
                    format(new Date(date), "MMM dd, yyyy")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#8884d8"
                  name="Orders"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics.statusDistribution).map(
                    ([status, count]) => ({
                      name: status,
                      value: count,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analytics.statusDistribution).map(
                    (entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.paymentMethodDistribution).map(
            ([method, count]) => (
              <div key={method} className="p-4 border rounded-lg text-center">
                <h4 className="font-semibold capitalize">{method}</h4>
                <p className="text-2xl">{count}</p>
                <p className="text-sm text-gray-500">
                  {Math.round((count / analytics.totalOrders) * 100)}%
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
