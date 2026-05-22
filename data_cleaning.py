import pandas as pd
import numpy as np
from datetime import datetime

def clean_supply_chain_data(input_path="raw_supply_chain_data.csv", output_path="clean_supply_chain_data.csv"):
    print("=== STARTING DATA CLEANING & PREPROCESSING ===")
    
    # 1. Load dataset
    df = pd.read_csv(input_path)
    print(f"Initial shape of the raw dataset: {df.shape}")
    
    # 2. Duplicate detection and removal
    duplicates_count = df.duplicated().sum()
    print(f"Total exact duplicate rows found: {duplicates_count}")
    df = df.drop_duplicates()
    print(f"Shape after removing duplicates: {df.shape}")
    
    # 3. Standardize Product Categories
    print("Standardizing Product Categories...")
    category_mapping = {
        'Elect.': 'Electronics',
        'F&B': 'Food & Beverages',
        'Pharma': 'Pharmaceuticals'
    }
    df['Product_Category'] = df['Product_Category'].replace(category_mapping)
    print(f"Unique product categories after cleanup: {df['Product_Category'].unique()}")
    
    # 4. Standardize Supplier Regions
    print("Standardizing Supplier Regions...")
    df['Supplier_Region'] = df['Supplier_Region'].astype(str).str.strip()
    
    def standard_region(reg):
        reg_clean = reg.lower()
        if reg_clean in ['north', 'n']:
            return 'North'
        elif reg_clean in ['south', 's']:
            return 'South'
        elif reg_clean in ['east', 'e']:
            return 'East'
        elif reg_clean in ['west', 'w']:
            return 'West'
        elif reg_clean == 'northeast':
            return 'Northeast'
        return reg.title() # fallback
        
    df['Supplier_Region'] = df['Supplier_Region'].apply(standard_region)
    print(f"Unique supplier regions after cleanup: {df['Supplier_Region'].unique()}")
    
    # 5. Standardize Date Fields
    print("Parsing and standardizing dates...")
    
    # Standardize Order_Date (formats: YYYY-MM-DD or DD/MM/YYYY)
    def parse_order_date(date_str):
        if pd.isna(date_str):
            return pd.NaT
        date_str = str(date_str).strip()
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
            try:
                return pd.to_datetime(date_str, format=fmt)
            except ValueError:
                continue
        # Fallback parsing
        try:
            return pd.to_datetime(date_str)
        except:
            return pd.NaT
            
    df['Order_Date'] = df['Order_Date'].apply(parse_order_date)
    
    # Standardize Actual_Delivery_Date (formats: YYYY-MM-DD or 'May 05, 2025' or 'DELAYED_LOST' or null)
    def parse_actual_date(date_str):
        if pd.isna(date_str) or str(date_str).strip() in ['', 'nan', 'DELAYED_LOST', 'LOST']:
            return pd.NaT
        date_str = str(date_str).strip()
        for fmt in ('%Y-%m-%d', '%b %d, %Y', '%B %d, %Y', '%d/%m/%Y'):
            try:
                return pd.to_datetime(date_str, format=fmt)
            except ValueError:
                continue
        try:
            return pd.to_datetime(date_str)
        except:
            return pd.NaT
            
    df['Actual_Delivery_Date'] = df['Actual_Delivery_Date'].apply(parse_actual_date)
    df['Expected_Delivery_Date'] = pd.to_datetime(df['Expected_Delivery_Date'], errors='coerce')
    
    print("Date conversion completed successfully.")
    
    # 6. Handle Invalid Records
    print("Handling invalid records...")
    
    # A. Filter out Order_Quantity <= 0
    invalid_qty_count = (df['Order_Quantity'] <= 0).sum()
    print(f"Found {invalid_qty_count} records with invalid Order Quantity (<= 0). Removing them.")
    df = df[df['Order_Quantity'] > 0]
    
    # B. Fix Delivered Quantity greater than Order Quantity
    invalid_delivery_mask = df['Delivered_Quantity'] > df['Order_Quantity']
    invalid_delivery_count = invalid_delivery_mask.sum()
    print(f"Found {invalid_delivery_count} records where Delivered_Quantity > Order_Quantity. Capping them.")
    df.loc[invalid_delivery_mask, 'Delivered_Quantity'] = df.loc[invalid_delivery_mask, 'Order_Quantity']
    
    # C. Correct Negative Transportation Costs
    neg_cost_mask = df['Transportation_Cost_INR'] < 0
    neg_cost_count = neg_cost_mask.sum()
    print(f"Found {neg_cost_count} records with negative Transportation Cost. Standardizing to positive multipliers...")
    
    # Calculate median shipping cost per unit for each transportation mode to use as reference
    df_positive_costs = df[df['Transportation_Cost_INR'] >= 0]
    # Estimate standard shipping rate per unit
    df['Cost_Per_Unit'] = df['Transportation_Cost_INR'] / df['Delivered_Quantity']
    mode_rates = df_positive_costs.groupby('Transportation_Mode').apply(
        lambda x: (x['Transportation_Cost_INR'] / x['Delivered_Quantity']).median()
    ).to_dict()
    print(f"Calculated standard shipping rates per unit by mode: {mode_rates}")
    
    # Apply standard rate if transportation cost is negative or null
    for mode, rate in mode_rates.items():
        # Correct negative costs
        neg_mode_mask = (df['Transportation_Mode'] == mode) & (df['Transportation_Cost_INR'] < 0)
        df.loc[neg_mode_mask, 'Transportation_Cost_INR'] = round(df.loc[neg_mode_mask, 'Delivered_Quantity'] * rate)
        
        # Correct null costs
        null_mode_mask = (df['Transportation_Mode'] == mode) & (df['Transportation_Cost_INR'].isna())
        df.loc[null_mode_mask, 'Transportation_Cost_INR'] = round(df.loc[null_mode_mask, 'Delivered_Quantity'] * rate)
        
    df.drop(columns=['Cost_Per_Unit'], inplace=True)
    
    # 7. Impute Remaining Missing Values
    print("Imputing missing values...")
    
    # A. Impute Supplier_Rating
    # Get mean rating per supplier, fallback to global mean rating
    global_mean_rating = df['Supplier_Rating'].mean()
    supplier_mean_ratings = df.groupby('Supplier_ID')['Supplier_Rating'].mean().fillna(global_mean_rating).to_dict()
    
    null_rating_mask = df['Supplier_Rating'].isna()
    null_rating_count = null_rating_mask.sum()
    print(f"Imputing {null_rating_count} missing Supplier Ratings based on Supplier averages...")
    df.loc[null_rating_mask, 'Supplier_Rating'] = df.loc[null_rating_mask, 'Supplier_ID'].map(supplier_mean_ratings)
    
    # B. Impute Warehouse_Utilization_Rate
    global_mean_util = df['Warehouse_Utilization_Rate'].mean()
    warehouse_mean_utils = df.groupby('Warehouse_ID')['Warehouse_Utilization_Rate'].mean().fillna(global_mean_util).to_dict()
    
    null_util_mask = df['Warehouse_Utilization_Rate'].isna()
    null_util_count = null_util_mask.sum()
    print(f"Imputing {null_util_count} missing Warehouse Utilization Rates based on Warehouse averages...")
    df.loc[null_util_mask, 'Warehouse_Utilization_Rate'] = df.loc[null_util_mask, 'Warehouse_ID'].map(warehouse_mean_utils)
    
    # C. Impute Delivered_Quantity
    # Impute missing Delivered_Quantity using Order_Quantity * supplier's average fill rate
    # Fill rate = Delivered_Quantity / Order_Quantity
    df_valid_delivery = df[df['Delivered_Quantity'].notna()]
    df_valid_delivery['Fill_Rate'] = df_valid_delivery['Delivered_Quantity'] / df_valid_delivery['Order_Quantity']
    supplier_fill_rates = df_valid_delivery.groupby('Supplier_ID')['Fill_Rate'].mean().fillna(1.0).to_dict()
    
    null_delivery_mask = df['Delivered_Quantity'].isna()
    null_delivery_count = null_delivery_mask.sum()
    print(f"Imputing {null_delivery_count} missing Delivered Quantities using supplier average fill rates...")
    
    df.loc[null_delivery_mask, 'Delivered_Quantity'] = (
        df.loc[null_delivery_mask, 'Order_Quantity'] * df.loc[null_delivery_mask, 'Supplier_ID'].map(supplier_fill_rates)
    ).round().astype(int)
    
    # 8. Create Calculated Columns for KPIs and Analytics
    print("Creating analytical and KPI fields...")
    
    # Order Fill Rate Pct
    df['Order_Fill_Rate_Pct'] = round((df['Delivered_Quantity'] / df['Order_Quantity']) * 100, 2)
    
    # On-Time Delivery Flag (1 if Actual Delivery <= Expected Delivery, else 0)
    # Lost/In-transit shipments (where Actual_Delivery_Date is NaT) are not On-Time (0)
    df['On_Time_Delivery'] = 0
    on_time_mask = (df['Actual_Delivery_Date'].notna()) & (df['Actual_Delivery_Date'] <= df['Expected_Delivery_Date'])
    df.loc[on_time_mask, 'On_Time_Delivery'] = 1
    
    # Lead Time Variance (Actual Delivery Days - Expected Delivery Days)
    # If shipment is lost/in-transit, set to NaT or 0 depending on usage; we will compute it based on the parsed dates
    df['Actual_Lead_Time_Days'] = (df['Actual_Delivery_Date'] - df['Order_Date']).dt.days
    df['Expected_Lead_Time_Days'] = (df['Expected_Delivery_Date'] - df['Order_Date']).dt.days
    df['Lead_Time_Variance'] = df['Actual_Lead_Time_Days'] - df['Expected_Lead_Time_Days']
    
    # Delayed Shipment Flag (1 if Actual > Expected, or if it is lost/delayed)
    df['Delayed_Shipment'] = 0
    delayed_mask = (df['Actual_Delivery_Date'].isna()) | (df['Actual_Delivery_Date'] > df['Expected_Delivery_Date'])
    df.loc[delayed_mask, 'Delayed_Shipment'] = 1
    
    # If actual lead time is NaN, let's back-fill using Supplier_Lead_Time_Days if it exists, or drop column
    # Supplier_Lead_Time_Days in the raw data contains the calculated lead time (including disruption). Let's use it to clean up Actual_Lead_Time_Days
    df['Actual_Lead_Time_Days'] = df['Actual_Lead_Time_Days'].fillna(df['Supplier_Lead_Time_Days'])
    df.drop(columns=['Supplier_Lead_Time_Days'], inplace=True)
    df.rename(columns={'Actual_Lead_Time_Days': 'Supplier_Lead_Time_Days'}, inplace=True)
    
    # 9. Verify and Output
    print(f"Final shape of the clean dataset: {df.shape}")
    print(f"Null values summary in final dataset:\n{df.isnull().sum()}")
    
    df.to_csv(output_path, index=False)
    print(f"Cleaned dataset successfully saved to '{output_path}'.")
    print("=== DATA CLEANING & PREPROCESSING COMPLETE ===")

if __name__ == "__main__":
    clean_supply_chain_data()
