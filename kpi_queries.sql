-- ====================================================================
-- SUPPLY CHAIN DISRUPTION ANALYSIS & OPERATIONAL KPI MONITORING
-- Standard ANSI SQL Queries for KPI Analysis and Operational Reporting
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. Database Schema Setup DDL (Mock Table Definition)
-- --------------------------------------------------------------------
CREATE TABLE supply_chain_shipments (
    Order_ID VARCHAR(20) PRIMARY KEY,
    Order_Date DATE NOT NULL,
    Product_ID VARCHAR(20),
    Product_Category VARCHAR(50),
    Supplier_ID VARCHAR(20),
    Supplier_Name VARCHAR(100),
    Supplier_Region VARCHAR(20),
    Supplier_Rating DECIMAL(3, 2),
    Transportation_Mode VARCHAR(20),
    Order_Quantity INT,
    Delivered_Quantity INT,
    Product_Unit_Cost_INR DECIMAL(12, 2),
    Transportation_Cost_INR DECIMAL(12, 2),
    Expected_Delivery_Date DATE NOT NULL,
    Actual_Delivery_Date DATE,
    Disruption_Type VARCHAR(50),
    Disruption_Impact_Days INT,
    Warehouse_ID VARCHAR(20),
    Warehouse_Capacity INT,
    Warehouse_Utilization_Rate DECIMAL(5, 2),
    Stockout_Flag INT,
    Market_Price_INR DECIMAL(15, 2),
    Order_Fill_Rate_Pct DECIMAL(5, 2),
    On_Time_Delivery INT,
    Supplier_Lead_Time_Days INT,
    Expected_Lead_Time_Days INT,
    Lead_Time_Variance INT,
    Delayed_Shipment INT
);


-- --------------------------------------------------------------------
-- 1. Executive Summary KPI Dashboard Card Query
-- Calculates the core 5 supply chain metrics across the entire operation.
-- --------------------------------------------------------------------
SELECT 
    COUNT(Order_ID) AS Total_Orders,
    ROUND(SUM(On_Time_Delivery) * 100.0 / COUNT(Order_ID), 2) AS On_Time_Delivery_Rate_OTDR,
    ROUND(AVG(Order_Fill_Rate_Pct), 2) AS Avg_Order_Fill_Rate,
    SUM(Stockout_Flag) AS Total_Stockouts,
    ROUND(SUM(Stockout_Flag) * 100.0 / COUNT(Order_ID), 2) AS Stockout_Frequency_Rate,
    ROUND(AVG(Supplier_Lead_Time_Days), 2) AS Avg_Supplier_Lead_Time_Days,
    ROUND(SUM(Transportation_Cost_INR) / 100000.0, 2) AS Total_Trans_Cost_Lakhs
FROM supply_chain_shipments;


-- --------------------------------------------------------------------
-- 2. Supplier Performance Scoring Matrix
-- Ranks suppliers using a multi-factor score: 
-- Score = (OTDR * 0.4) + (OFR * 0.4) + ((5 - Avg_Lead_Time) * 20 * 0.2)
-- --------------------------------------------------------------------
WITH SupplierBaseMetrics AS (
    SELECT 
        Supplier_ID,
        Supplier_Name,
        Supplier_Region,
        COUNT(Order_ID) AS Total_Orders,
        AVG(Supplier_Rating) AS Avg_Historical_Rating,
        AVG(Supplier_Lead_Time_Days) AS Avg_Lead_Time,
        SUM(On_Time_Delivery) * 100.0 / COUNT(Order_ID) AS OTDR,
        AVG(Order_Fill_Rate_Pct) AS OFR,
        SUM(Stockout_Flag) AS Stockout_Count
    FROM supply_chain_shipments
    GROUP BY Supplier_ID, Supplier_Name, Supplier_Region
),
SupplierNormalizedScore AS (
    SELECT 
        *,
        -- Normalize Average Lead Time (capped between 0 and 20 for scoring purposes)
        CASE 
            WHEN Avg_Lead_Time > 20 THEN 0 
            ELSE (20 - Avg_Lead_Time) * (100.0 / 20.0) 
        END AS Normalized_Lead_Time_Score
    FROM SupplierBaseMetrics
)
SELECT 
    Supplier_ID,
    Supplier_Name,
    Supplier_Region,
    Total_Orders,
    ROUND(Avg_Historical_Rating, 2) AS Avg_Rating,
    ROUND(Avg_Lead_Time, 2) AS Avg_Lead_Time_Days,
    ROUND(OTDR, 2) AS On_Time_Delivery_Pct,
    ROUND(OFR, 2) AS Order_Fill_Rate_Pct,
    Stockout_Count,
    -- Performance score (0 to 100 scale)
    ROUND((OTDR * 0.4) + (OFR * 0.4) + (Normalized_Lead_Time_Score * 0.2), 2) AS Overall_Supplier_Score,
    -- Ranking Suppliers based on Overall Score
    DENSE_RANK() OVER (ORDER BY (OTDR * 0.4) + (OFR * 0.4) + (Normalized_Lead_Time_Score * 0.2) DESC) AS Supplier_Performance_Rank
FROM SupplierNormalizedScore
ORDER BY Overall_Supplier_Score DESC;


-- --------------------------------------------------------------------
-- 3. Disruption Hotspots & Financial Exposure Analysis
-- Evaluates where and how disruptions impact operations and transit costs.
-- --------------------------------------------------------------------
SELECT 
    Supplier_Region,
    Transportation_Mode,
    Disruption_Type,
    COUNT(Order_ID) AS Disrupted_Orders_Count,
    ROUND(AVG(Disruption_Impact_Days), 2) AS Avg_Disruption_Delay_Days,
    ROUND(AVG(Lead_Time_Variance), 2) AS Avg_Lead_Time_Variance_Days,
    ROUND(SUM(Transportation_Cost_INR) / 100000.0, 2) AS Transportation_Spent_Lakhs,
    ROUND(AVG(Transportation_Cost_INR), 2) AS Avg_Transportation_Cost_INR
FROM supply_chain_shipments
WHERE Disruption_Type <> 'None'
GROUP BY Supplier_Region, Transportation_Mode, Disruption_Type
ORDER BY Disrupted_Orders_Count DESC, Avg_Disruption_Delay_Days DESC;


-- --------------------------------------------------------------------
-- 4. Warehouse Operational Stress Profile
-- Identifies warehouse capacity constraints and stockout correlations.
-- --------------------------------------------------------------------
SELECT 
    Warehouse_ID,
    Warehouse_Capacity,
    ROUND(AVG(Warehouse_Utilization_Rate) * 100.0, 2) AS Avg_Utilization_Pct,
    SUM(Stockout_Flag) AS Total_Stockouts,
    ROUND(SUM(Stockout_Flag) * 100.0 / COUNT(Order_ID), 2) AS Stockout_Frequency_Pct,
    COUNT(Order_ID) AS Total_Fulfillment_Orders
FROM supply_chain_shipments
GROUP BY Warehouse_ID, Warehouse_Capacity
ORDER BY Avg_Utilization_Pct DESC;


-- --------------------------------------------------------------------
-- 5. Month-over-Month (MoM) Delivery Delay Trends
-- Uses SQL window functions to compute lead time variance growth.
-- --------------------------------------------------------------------
WITH MonthlyTransitStats AS (
    SELECT 
        -- Group by YYYY-MM
        DATE_TRUNC('month', Order_Date) AS Order_Month,
        COUNT(Order_ID) AS Total_Shipments,
        SUM(Delayed_Shipment) AS Total_Delayed_Shipments,
        AVG(Supplier_Lead_Time_Days) AS Monthly_Avg_Lead_Time,
        SUM(Transportation_Cost_INR) AS Monthly_Trans_Cost
    FROM supply_chain_shipments
    GROUP BY DATE_TRUNC('month', Order_Date)
)
SELECT 
    TO_CHAR(Order_Month, 'YYYY-MM') AS Year_Month,
    Total_Shipments,
    Total_Delayed_Shipments,
    ROUND(Total_Delayed_Shipments * 100.0 / Total_Shipments, 2) AS Delayed_Shipment_Rate_Pct,
    ROUND(Monthly_Avg_Lead_Time, 2) AS Avg_Lead_Time_Days,
    ROUND(Monthly_Trans_Cost / 100000.0, 2) AS Trans_Cost_Lakhs,
    -- MoM percentage point change in Delayed Shipment Rate
    ROUND(
        (Total_Delayed_Shipments * 100.0 / Total_Shipments) - 
        LAG(Total_Delayed_Shipments * 100.0 / Total_Shipments, 1) OVER (ORDER BY Order_Month),
        2
    ) AS Delayed_Rate_MoM_Difference
FROM MonthlyTransitStats
ORDER BY Year_Month;


-- --------------------------------------------------------------------
-- 6. Product Category Lead Time & Risk Exposure
-- Aggregates inventory and supply metrics to pinpoint fragile product segments.
-- --------------------------------------------------------------------
SELECT 
    Product_Category,
    COUNT(DISTINCT Product_ID) AS Unique_Products_Count,
    COUNT(Order_ID) AS Total_Orders,
    ROUND(AVG(Order_Fill_Rate_Pct), 2) AS Avg_Order_Fill_Rate_Pct,
    ROUND(AVG(Supplier_Lead_Time_Days), 2) AS Avg_Lead_Time_Days,
    SUM(Stockout_Flag) AS Total_Stockouts,
    ROUND(SUM(Market_Price_INR) / 10000000.0, 2) AS Total_Market_Value_Crores
FROM supply_chain_shipments
GROUP BY Product_Category
ORDER BY Total_Orders DESC;
