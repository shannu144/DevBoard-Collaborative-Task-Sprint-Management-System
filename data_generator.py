import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_supply_chain_data(output_path="raw_supply_chain_data.csv", num_records=85000):
    print("Generating raw supply chain dataset...")
    np.random.seed(42)
    random.seed(42)
    
    # 1. Base entities
    suppliers = {
        'SUPP-201': {'name': 'Apex Logistics', 'base_rating': 4.5, 'region': 'North', 'lead_time': 5},
        'SUPP-202': {'name': 'Global Industries', 'base_rating': 4.2, 'region': 'East', 'lead_time': 8},
        'SUPP-203': {'name': 'Vortex Parts', 'base_rating': 3.9, 'region': 'West', 'lead_time': 12},
        'SUPP-204': {'name': 'Synapse Tech', 'base_rating': 4.7, 'region': 'South', 'lead_time': 4},
        'SUPP-205': {'name': 'Summit Supply', 'base_rating': 2.3, 'region': 'North', 'lead_time': 14}, # High disruption supplier
        'SUPP-206': {'name': 'Zephyr Pharma', 'base_rating': 4.6, 'region': 'South', 'lead_time': 3},
        'SUPP-207': {'name': 'Titan Auto', 'base_rating': 3.5, 'region': 'West', 'lead_time': 10},
        'SUPP-208': {'name': 'Beacon Apparel', 'base_rating': 4.1, 'region': 'East', 'lead_time': 7},
        'SUPP-209': {'name': 'Nova Trans', 'base_rating': 2.8, 'region': 'North', 'lead_time': 15}, # Low performance
        'SUPP-210': {'name': 'Pinnacle Goods', 'base_rating': 4.4, 'region': 'West', 'lead_time': 9},
        'SUPP-211': {'name': 'Meridian Supply', 'base_rating': 3.2, 'region': 'East', 'lead_time': 11},
        'SUPP-212': {'name': 'Omega Works', 'base_rating': 4.3, 'region': 'South', 'lead_time': 6},
        'SUPP-213': {'name': 'Velocity Industrial', 'base_rating': 2.5, 'region': 'West', 'lead_time': 16}, # High lead time/low performance
        'SUPP-214': {'name': 'Echo Supply Services', 'base_rating': 4.0, 'region': 'North', 'lead_time': 6},
        'SUPP-215': {'name': 'Quantum Parts Corp', 'base_rating': 4.8, 'region': 'South', 'lead_time': 4}
    }
    
    products = {
        'PROD-101': {'category': 'Electronics', 'cost': 18500},
        'PROD-102': {'category': 'Electronics', 'cost': 24000},
        'PROD-103': {'category': 'Electronics', 'cost': 12000},
        'PROD-104': {'category': 'Automotive Parts', 'cost': 9500},
        'PROD-105': {'category': 'Automotive Parts', 'cost': 15000},
        'PROD-106': {'category': 'Automotive Parts', 'cost': 6200},
        'PROD-107': {'category': 'Apparel', 'cost': 1500},
        'PROD-108': {'category': 'Apparel', 'cost': 2200},
        'PROD-109': {'category': 'Apparel', 'cost': 3500},
        'PROD-110': {'category': 'Pharmaceuticals', 'cost': 4500},
        'PROD-111': {'category': 'Pharmaceuticals', 'cost': 8500},
        'PROD-112': {'category': 'Pharmaceuticals', 'cost': 11500},
        'PROD-113': {'category': 'Food & Beverages', 'cost': 850},
        'PROD-114': {'category': 'Food & Beverages', 'cost': 1200},
        'PROD-115': {'category': 'Food & Beverages', 'cost': 2500},
        'PROD-116': {'category': 'Industrial Equipment', 'cost': 45000},
        'PROD-117': {'category': 'Industrial Equipment', 'cost': 85000},
        'PROD-118': {'category': 'Industrial Equipment', 'cost': 32000},
        'PROD-119': {'category': 'Consumer Goods', 'cost': 1800},
        'PROD-120': {'category': 'Consumer Goods', 'cost': 2800},
        'PROD-121': {'category': 'Consumer Goods', 'cost': 4200},
        'PROD-122': {'category': 'Chemicals', 'cost': 13500},
        'PROD-123': {'category': 'Chemicals', 'cost': 22000},
        'PROD-124': {'category': 'Construction Materials', 'cost': 5500},
        'PROD-125': {'category': 'Construction Materials', 'cost': 8500}
    }
    
    warehouses = {
        'WH-301': {'capacity': 100000, 'region': 'North'},
        'WH-302': {'capacity': 80000, 'region': 'East'},
        'WH-303': {'capacity': 150000, 'region': 'West'},
        'WH-304': {'capacity': 120000, 'region': 'South'}
    }
    
    modes = ['Road', 'Air', 'Sea', 'Rail']
    disruptions = ['None', 'Weather Severe', 'Customs Bottleneck', 'Labor Strike', 'Equipment Failure', 'Fuel Price Spike']
    
    start_date = datetime(2025, 1, 1)
    
    # Pre-allocating list
    data = []
    
    print("Generating base records...")
    for i in range(num_records):
        order_id = f"ORD-{100000 + i}"
        
        # Date generation: uniformly distributed over the last ~17 months (500 days)
        days_offset = random.randint(0, 500)
        order_date_dt = start_date + timedelta(days=days_offset)
        order_date_str = order_date_dt.strftime('%Y-%m-%d')
        
        # Product & Supplier selection
        prod_id = random.choice(list(products.keys()))
        prod_info = products[prod_id]
        
        supp_id = random.choice(list(suppliers.keys()))
        supp_info = suppliers[supp_id]
        
        # Ensure regional sense in warehouse mapping (usually warehouses store goods from various regions)
        wh_id = random.choice(list(warehouses.keys()))
        wh_info = warehouses[wh_id]
        
        # Quantity details
        order_qty = random.randint(5, 500)
        
        # Order Fill Rate calculation: 94% are fully filled, 5.5% are partially filled, 0.5% are invalid (delivered > ordered)
        fill_rand = random.random()
        if fill_rand < 0.94:
            delivered_qty = order_qty
        elif fill_rand < 0.995:
            delivered_qty = int(order_qty * random.uniform(0.70, 0.98))
        else:
            delivered_qty = int(order_qty * random.uniform(1.05, 1.20)) # Invalid data!
            
        unit_cost = prod_info['cost']
        
        # Transportation mode & Cost
        mode = random.choice(modes)
        # Base shipping cost per unit
        mode_cost_multiplier = {'Air': 120, 'Road': 25, 'Rail': 18, 'Sea': 12}
        trans_cost = int(delivered_qty * mode_cost_multiplier[mode] * random.uniform(0.9, 1.1))
        
        # Lead time calculation
        base_lead = supp_info['lead_time']
        
        # Disruption modeling (heavily correlated with supplier and mode)
        dis_rand = random.random()
        dis_type = 'None'
        dis_days = 0
        
        # High risk suppliers or specific logistics challenges
        if supp_id in ['SUPP-205', 'SUPP-209', 'SUPP-213'] and dis_rand < 0.35:
            dis_type = random.choice(['Weather Severe', 'Equipment Failure', 'Labor Strike'])
            dis_days = random.randint(5, 15)
        elif mode == 'Sea' and dis_rand < 0.20:
            dis_type = 'Customs Bottleneck'
            dis_days = random.randint(4, 12)
        elif mode == 'Road' and dis_rand < 0.15:
            dis_type = 'Weather Severe'
            dis_days = random.randint(2, 7)
        elif dis_rand < 0.05: # General risk
            dis_type = random.choice(disruptions[1:])
            dis_days = random.randint(1, 6)
            
        actual_lead_time = base_lead + dis_days + random.randint(-1, 2)
        actual_lead_time = max(1, actual_lead_time) # Minimum 1 day lead time
        
        # Expected delivery days (ideal contract lead time)
        expected_days = base_lead + random.randint(0, 2)
        expected_delivery_dt = order_date_dt + timedelta(days=expected_days)
        expected_delivery_str = expected_delivery_dt.strftime('%Y-%m-%d')
        
        # Actual delivery date calculation
        actual_delivery_dt = order_date_dt + timedelta(days=actual_lead_time)
        actual_delivery_str = actual_delivery_dt.strftime('%Y-%m-%d')
        
        # Introduce in-transit/lost/undelivered shipments (2.5% of total orders have no actual delivery date)
        if random.random() < 0.025:
            actual_delivery_str = ""
            actual_lead_time = np.nan
        
        # Rating details (1.0 to 5.0)
        rating_noise = random.uniform(-0.8, 0.8)
        rating = round(max(1.0, min(5.0, supp_info['base_rating'] + rating_noise)), 1)
        
        # Stockout frequency details (correlated with long lead times or high quantity)
        stockout = 0
        if actual_lead_time > expected_days + 4 and random.random() < 0.40:
            stockout = 1
        elif order_qty > 400 and random.random() < 0.15:
            stockout = 1
            
        # Warehouse current occupancy level estimation (average 60% to 95%)
        wh_capacity = wh_info['capacity']
        wh_util = round(random.uniform(0.55, 0.98), 2)
        
        # Market price multiplier for savings analysis
        market_price = int(unit_cost * order_qty)
        
        # Region Inconsistencies for Suppliers
        region = supp_info['region']
        region_rand = random.random()
        if region_rand < 0.02:
            region = region.lower()
        elif region_rand < 0.04:
            region = region.upper()
        elif region_rand < 0.05:
            region = region[0] # 'N', 'E', 'S', 'W'
            
        # Add to main table
        data.append({
            'Order_ID': order_id,
            'Order_Date': order_date_str,
            'Product_ID': prod_id,
            'Product_Category': prod_info['category'],
            'Supplier_ID': supp_id,
            'Supplier_Name': supp_info['name'],
            'Supplier_Region': region,
            'Supplier_Rating': rating,
            'Supplier_Lead_Time_Days': actual_lead_time,
            'Transportation_Mode': mode,
            'Order_Quantity': order_qty,
            'Delivered_Quantity': delivered_qty,
            'Product_Unit_Cost_INR': unit_cost,
            'Transportation_Cost_INR': trans_cost,
            'Expected_Delivery_Date': expected_delivery_str,
            'Actual_Delivery_Date': actual_delivery_str,
            'Disruption_Type': dis_type,
            'Disruption_Impact_Days': dis_days,
            'Warehouse_ID': wh_id,
            'Warehouse_Capacity': wh_capacity,
            'Warehouse_Utilization_Rate': wh_util,
            'Stockout_Flag': stockout,
            'Market_Price_INR': market_price
        })
        
    df = pd.DataFrame(data)
    
    # 2. INJECTING IMPURITIES AND ANOMALIES FOR THE CLEANING STEP
    print("Injecting impurities and anomalies...")
    
    # A. Missing values (around 3% missing in critical fields)
    df.loc[df.sample(frac=0.03, random_state=10).index, 'Supplier_Rating'] = np.nan
    df.loc[df.sample(frac=0.025, random_state=20).index, 'Transportation_Cost_INR'] = np.nan
    df.loc[df.sample(frac=0.02, random_state=30).index, 'Warehouse_Utilization_Rate'] = np.nan
    df.loc[df.sample(frac=0.015, random_state=40).index, 'Delivered_Quantity'] = np.nan
    
    # B. Duplicates (Append 1,500 exact duplicate rows to simulate double entries)
    dup_rows = df.sample(n=1500, random_state=42)
    df = pd.concat([df, dup_rows], ignore_index=True)
    
    # C. Inconsistent Date Formats in Order_Date and Actual_Delivery_Date
    # We will format about 2% of the dates to 'DD/MM/YYYY' or 'MM-DD-YYYY' or text like '05-May-2025' or 'LOST'
    inconsistent_dates_idx = df.sample(frac=0.015, random_state=50).index
    df.loc[inconsistent_dates_idx, 'Order_Date'] = df.loc[inconsistent_dates_idx, 'Order_Date'].apply(
        lambda x: datetime.strptime(x, '%Y-%m-%d').strftime('%d/%m/%Y') if pd.notna(x) else x
    )
    
    inconsistent_actual_idx = df.sample(frac=0.01, random_state=60).index
    df.loc[inconsistent_actual_idx, 'Actual_Delivery_Date'] = df.loc[inconsistent_actual_idx, 'Actual_Delivery_Date'].apply(
        lambda x: datetime.strptime(x, '%Y-%m-%d').strftime('%b %d, %Y') if (pd.notna(x) and x != "") else 'DELAYED_LOST'
    )
    
    # D. Invalid records
    # Order Quantity = 0 (about 100 rows)
    zero_qty_idx = df.sample(n=100, random_state=70).index
    df.loc[zero_qty_idx, 'Order_Quantity'] = 0
    
    # Negative Transportation Cost (about 120 rows)
    neg_cost_idx = df.sample(n=120, random_state=80).index
    df.loc[neg_cost_idx, 'Transportation_Cost_INR'] = -5000
    
    # E. Inconsistent Category naming (e.g. 'F&B' instead of 'Food & Beverages' or 'Elect.' instead of 'Electronics')
    cat_inconsistent_idx = df.sample(frac=0.02, random_state=90).index
    df.loc[cat_inconsistent_idx, 'Product_Category'] = df.loc[cat_inconsistent_idx, 'Product_Category'].replace({
        'Electronics': 'Elect.',
        'Food & Beverages': 'F&B',
        'Pharmaceuticals': 'Pharma'
    })
    
    # Save the raw data
    df.to_csv(output_path, index=False)
    print(f"Dataset successfully created and saved to '{output_path}'.")
    print(f"Total shape of generated raw dataset: {df.shape}")
    
if __name__ == "__main__":
    generate_supply_chain_data()
