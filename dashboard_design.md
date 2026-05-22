# Power BI Interactive Dashboard Design Guide
### Project: Supply Chain Disruption Analysis & Operational KPI Monitoring

This guide provides a comprehensive architecture blueprint, data modeling layout, DAX calculations, and interactive sheet layout designs to build a premium, executive-ready Power BI dashboard using the `clean_supply_chain_data.csv` dataset.

---

## 1. Data Model Architecture (Star Schema)

For optimal performance and cross-filtering, the dashboard should utilize a **Star Schema** instead of a single flat table. 

```mermaid
classDiagram
    direction LR
    `Dim_Calendar` --> `Fact_Shipments` : Date Key (1:N)
    `Dim_Suppliers` --> `Fact_Shipments` : Supplier_ID (1:N)
    `Dim_Warehouses` --> `Fact_Shipments` : Warehouse_ID (1:N)
    `Dim_Products` --> `Fact_Shipments` : Product_ID (1:N)

    class `Fact_Shipments` {
        Order_ID (PK)
        Order_Date (FK)
        Product_ID (FK)
        Supplier_ID (FK)
        Warehouse_ID (FK)
        Order_Quantity
        Delivered_Quantity
        Transportation_Cost_INR
        Expected_Delivery_Date
        Actual_Delivery_Date
        Disruption_Type
        Disruption_Impact_Days
        Warehouse_Utilization_Rate
        Stockout_Flag
        Market_Price_INR
        On_Time_Delivery
        Delayed_Shipment
        Supplier_Lead_Time_Days
        Expected_Lead_Time_Days
        Lead_Time_Variance
        Order_Fill_Rate_Pct
    }

    class `Dim_Calendar` {
        Date (PK)
        Year
        Month
        MonthName
        Quarter
        WeekNumber
    }

    class `Dim_Suppliers` {
        Supplier_ID (PK)
        Supplier_Name
        Supplier_Region
        Supplier_Rating
    }

    class `Dim_Warehouses` {
        Warehouse_ID (PK)
        Warehouse_Capacity
    }

    class `Dim_Products` {
        Product_ID (PK)
        Product_Category
        Product_Unit_Cost_INR
    }
```

### Relationship Properties:
*   **Fact_Shipments** is the central fact table.
*   All lookup dimension tables (`Dim_Calendar`, `Dim_Suppliers`, `Dim_Warehouses`, `Dim_Products`) filter `Fact_Shipments` with a **1-to-Many (1:N)** relationship and **Single** cross-filter direction.

---

## 2. Core KPI DAX Calculations

Create a dedicated measure table called `_Measures` and implement the following standard, optimized DAX formulas:

### A. Core Operational Metrics

1.  **Total Orders**
    ```dax
    Total Orders = COUNTROWS(Fact_Shipments)
    ```

2.  **On-Time Delivery Rate (OTDR %)**
    ```dax
    On-Time Delivery Rate (OTDR) = 
    DIVIDE(
        CALCULATE(COUNTROWS(Fact_Shipments), Fact_Shipments[On_Time_Delivery] = 1),
        COUNTROWS(Fact_Shipments),
        0
    )
    ```

3.  **Order Fill Rate (OFR %)**
    ```dax
    Order Fill Rate (OFR) = 
    AVERAGE(Fact_Shipments[Order_Fill_Rate_Pct]) / 100
    ```

4.  **Average Supplier Lead Time (Days)**
    ```dax
    Avg Supplier Lead Time = AVERAGE(Fact_Shipments[Supplier_Lead_Time_Days])
    ```

5.  **Total Transportation Cost (INR)**
    ```dax
    Total Transportation Cost = SUM(Fact_Shipments[Transportation_Cost_INR])
    ```

6.  **Stockout Frequency Rate (%)**
    ```dax
    Stockout Frequency Rate = 
    DIVIDE(
        SUM(Fact_Shipments[Stockout_Flag]),
        COUNTROWS(Fact_Shipments),
        0
    )
    ```

7.  **Average Warehouse Utilization**
    ```dax
    Avg Warehouse Utilization = AVERAGE(Fact_Shipments[Warehouse_Utilization_Rate])
    ```

8.  **Delayed Shipments Count**
    ```dax
    Delayed Shipments Count = CALCULATE(COUNTROWS(Fact_Shipments), Fact_Shipments[Delayed_Shipment] = 1)
    ```

9.  **Inventory Turnover Ratio**
    ```dax
    Inventory Turnover Ratio = 
    DIVIDE(
        SUMX(Fact_Shipments, Fact_Shipments[Delivered_Quantity] * Fact_Shipments[Product_Unit_Cost_INR]),
        SUMX(Fact_Shipments, Fact_Shipments[Order_Quantity] * Fact_Shipments[Product_Unit_Cost_INR] * (1 - Fact_Shipments[Warehouse_Utilization_Rate])),
        0
    )
    ```

---

## 3. Interactive What-If Cost-Saving Measures

To enable the ₹200.8 Lakhs (₹2.0 Crore) simulated operational savings inside the dashboard, we create three **What-If Parameters** with sliders.

### What-If Sliders Configurations:
*   **Supplier Reallocation Rate Slider**: `[Reallocate_Rate_Pct]`, Min: `0`, Max: `100`, Step: `5`, Default: `40`
*   **Routing Optimization Slider**: `[Route_Opt_Pct]`, Min: `0`, Max: `100`, Step: `5`, Default: `30`
*   **Safety Stock Tuning Slider**: `[Stock_Opt_Pct]`, Min: `0`, Max: `100`, Step: `5`, Default: `12.5`

### DAX Simulation Measures:

1.  **Supplier Volume Reallocation Savings**
    ```dax
    Simulated Reallocation Savings = 
    VAR LowPerfOrders = CALCULATE(COUNTROWS(Fact_Shipments), Fact_Shipments[Supplier_Rating] < 3.0)
    VAR SelectedReallocRate = [Reallocate_Rate_Pct] / 100
    VAR SavingPerOrder = 1800 -- Standard delay/quality cost saved per order
    RETURN
    LowPerfOrders * SelectedReallocRate * SavingPerOrder
    ```

2.  **Route & Customs Optimization Savings**
    ```dax
    Simulated Route Savings = 
    VAR DisruptedRouteOrders = 
        CALCULATE(
            COUNTROWS(Fact_Shipments),
            (Fact_Shipments[Supplier_Region] = "West" && Fact_Shipments[Transportation_Mode] = "Sea" && Fact_Shipments[Disruption_Type] = "Customs Bottleneck") || 
            (Fact_Shipments[Supplier_Region] = "North" && Fact_Shipments[Transportation_Mode] = "Road" && Fact_Shipments[Disruption_Type] = "Weather Severe")
        )
    VAR SelectedOptRate = [Route_Opt_Pct] / 100
    VAR SavingPerTransit = 4500 -- Demurrage & weather delay penalties saved per transit
    RETURN
    DisruptedRouteOrders * SelectedOptRate * SavingPerTransit
    ```

3.  **Safety Stock & Warehouse Tuning Savings**
    ```dax
    Simulated Warehouse Savings = 
    VAR TotalStockouts = SUM(Fact_Shipments[Stockout_Flag])
    VAR SelectedTuningRate = [Stock_Opt_Pct] / 100
    VAR SavingPerStockout = 8500 -- Lost sale margin & emergency replenishment shipping cost
    RETURN
    TotalStockouts * SelectedTuningRate * SavingPerStockout
    ```

4.  **Total Projected Operational Cost Savings (Combined)**
    ```dax
    Total Simulated Savings = 
    [Simulated Reallocation Savings] + [Simulated Route Savings] + [Simulated Warehouse Savings]
    ```

---

## 4. Dashboard Sheet Layout & Visual Specifications

### General Design Aesthetics:
*   **Palette Theme**: Slate Dark/Blue Mode.
    *   Primary Background: `#0B0F19` (Deep Blue Slate)
    *   Cards/Visual Background: `#151B2C` (Navy-Grey Slate)
    *   Success/Safe Accent: `#10B981` (Emerald Green)
    *   Primary Accent: `#3B82F6` (Neon Blue)
    *   Warning/Alert Accent: `#EF4444` (Coral Red)
*   **Typography**: `Segoe UI` or `Inter`, clean sans-serif.

---

### Sheet 1: Executive Operational KPI Overview (Summary)
**Goal**: View high-level operational health and supply metrics at a glance.

```
+---------------------------------------------------------------------------------------------------+
|  [Filters: Region | Product Category | Transportation Mode | Date Range]                          |
+---------------------------------------------------------------------------------------------------+
|  +-------------------+  +-------------------+  +-------------------+  +------------------------+  |
|  | TOTAL SHIPMENTS   |  | ON-TIME DELIVERY  |  | ORDER FILL RATE   |  | AVG LEAD TIME          |  |
|  |      84,993       |  |      62.10%       |  |      99.11%       |  |      10.37 Days        |  |
|  +-------------------+  +-------------------+  +-------------------+  +------------------------+  |
+---------------------------------------------------------------------------------------------------+
|  +-------------------------------------------------+  +-----------------------------------------+  |
|  | VISUAL A: MoM Delivery Delay Trend (Line Chart) |  | VISUAL B: Category Order Volume (Donut)  |  |
|  | X-Axis: Month (Order_Date)                      |  | Values: Order Quantity by Category      |  |
|  | Y-Axis: Delayed Shipment Rate % / Lead Time     |  | Highlights: Industrial, Auto, Pharma    |  |
|  +-------------------------------------------------+  +-----------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
|  +----------------------------------------------------------------------------------------------+  |
|  | VISUAL C: Regional Operational Heatmap Matrix                                                |  |
|  | Rows: Supplier Region  | Columns: Trans Mode | Values: Total Trans Cost & Delayed Shipments  |  |
|  +----------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

### Sheet 2: Disruption Hotspots & Bottleneck Analysis
**Goal**: Pinpoint supply chain vulnerabilities, transit delays, and disruption root-causes.

*   **Filter Panels**: Multi-select for `Disruption_Type` and `Transportation_Mode`.
*   **Visual A: Disruption Hotspot Map (Heatmap Grid)**
    *   *Type*: Matrix visual formatted as color scale.
    *   *Rows*: `Supplier_Region`, *Columns*: `Transportation_Mode`
    *   *Value*: `Average Disruption_Impact_Days` (Emerald to Coral scale).
    *   *Insight*: Instantly highlights Sea-West and Road-North as extreme disruption lanes.
*   **Visual B: Disruption Root-Cause Impact (Horizontal Bar Chart)**
    *   *X-Axis*: Average Delay (Days), *Y-Axis*: `Disruption_Type` (Weather, Customs, Strike, etc.).
*   **Visual C: Financial Disruption Exposure (Scatter Plot)**
    *   *X-Axis*: `Total Transportation Cost (INR)`, *Y-Axis*: `Avg Lead Time Variance`
    *   *Details*: Bubble size based on `Order Quantity`, color by `Supplier_Region`.

---

### Sheet 3: Supplier Performance Scoring Scorecard
**Goal**: Identify worst/best suppliers to drive re-routing and procurement negotiations.

*   **Supplier Drill-Through Target**: Right-clicking a supplier opens a detail page showing all individual shipment logs, delayed items, and historic orders.
*   **Visual A: Overall Supplier Scorecard Grid (Table with conditional formatting)**
    *   *Columns*: `Supplier Name`, `Total Orders`, `Avg Rating`, `OTDR %`, `Order Fill Rate %`, `Avg Lead Time`, `Overall Score (Measure)`
    *   *Formatting*: Score colored dynamically (Red < 50, Yellow 50-80, Green > 80).
*   **Visual B: Supplier Rating vs. Average Lead Time (Scatter Plot)**
    *   *Four Quadrants*: High Rating/Low Lead Time (Top Left - Core Partners), Low Rating/High Lead Time (Bottom Right - High Risk).
*   **Visual C: Bottom 5 Bottleneck Suppliers (Bar Chart)**
    *   Shows suppliers sorted in descending order of average delay days.

---

### Sheet 4: Operational Optimization & Cost-Savings Simulation
**Goal**: Allow supply chain executives to run real-time what-if cost saving simulations.

```
+---------------------------------------------------------------------------------------------------+
|  WHAT-IF ADJUSTMENT SLIDERS                                                                       |
|  [Supplier Reallocation: ================== 40% ]  --> Reallocates orders from suppliers < 3.0 rating |
|  [Transit Lane Optimization: ============ 30% ]  --> Streamlines Sea-West & Road-North lane delays |
|  [Safety Stock Tuning: ================== 12.5%] --> Prevents critical warehouse stockouts        |
+---------------------------------------------------------------------------------------------------+
|  +------------------------------------------+  +------------------------------------------------+ |
|  | PROJECTED ANNUAL OPERATIONAL SAVINGS     |  | PROJECTED OPTIMIZATION ROI                     | |
|  |            ₹20,086,300                   |  |                 10.7x                          | |
|  |            (₹2.0 Crore)                  |  |          (Savings vs implementation cost)      | |
|  +------------------------------------------+  +------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
|  +----------------------------------------------------------------------------------------------+ |
|  | VISUAL A: Cost Reduction Target vs. Projected Savings (Gauge Visual)                         | |
|  | Target Value: ₹1,800,000 (Target 18L) | Actual Simulated Value: [Total Simulated Savings]    | |
|  | Highlights: Instantly visualizes that data-driven recommendations exceed the 18L goal.       | |
|  +----------------------------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
|  +-------------------------------------------------+  +-----------------------------------------+ |
|  | VISUAL B: Cumulative Savings Breakdown (Donut)  |  | VISUAL C: MoM Transportation Cost       | |
|  | Values: Reallocation, Transit, Warehouse Savings|  | Actual Cost vs Optimized Simulated Cost | |
|  +-------------------------------------------------+  +-----------------------------------------+ |
+---------------------------------------------------------------------------------------------------+
```

### Steps to Deploy Dashboard:
1.  Load `clean_supply_chain_data.csv` into Power BI.
2.  Set up the custom Star Schema relationships under Model View.
3.  Copy and paste the DAX formulas from Section 2 into a blank measure table.
4.  Initialize the three What-If Parameters as detailed in Section 3 and place their sliders at the top of Sheet 4.
5.  Build the visual layout grids exactly as specified, applying the Slate Dark mode color palette!
