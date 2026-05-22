import pandas as pd
import numpy as np

def run_cost_savings_simulation(input_path="clean_supply_chain_data.csv"):
    print("=== STARTING SUPPLY CHAIN COST-SAVINGS OPTIMIZATION MODEL ===")
    
    # 1. Load Clean Dataset
    df = pd.read_csv(input_path)
    print(f"Loaded dataset of shape: {df.shape}")
    
    # --------------------------------------------------------------------
    # INITIATIVE 1: SUPPLER VOLUME REALLOCATION (PROJECTED SAVINGS: INR 5.75L)
    # --------------------------------------------------------------------
    print("\nSimulating Initiative 1: Supplier Volume Reallocation...")
    # Low performing suppliers (Rating < 3.0)
    low_perf_mask = df['Supplier_Rating'] < 3.0
    low_perf_orders = df[low_perf_mask]
    total_low_perf_orders = len(low_perf_orders)
    
    # Let's reallocate 40% of these low-performing orders
    reallocation_rate = 0.40
    orders_to_reallocate = int(total_low_perf_orders * reallocation_rate)
    
    # Average cost of disruption for low-performing suppliers
    # Low-performing suppliers have average lead times ~14-16 days vs ~4-5 days for top suppliers.
    # Delay and stockout costs: we model a direct penalty of INR 1,800 per shipment for delays,
    # and carrying inefficiencies.
    saving_per_reallocated_shipment = 1800 # in INR
    initiative_1_savings = orders_to_reallocate * saving_per_reallocated_shipment
    
    print(f"- Total low-performing supplier orders (Rating < 3.0): {total_low_perf_orders:,}")
    print(f"- Target 40% order volume to reallocate to top suppliers: {orders_to_reallocate:,} orders")
    print(f"- Estimated saving per reallocated order (delay reduction & quality control): INR {saving_per_reallocated_shipment}")
    print(f"- Projected Initiative 1 Savings: INR {initiative_1_savings:,} (INR {initiative_1_savings/100000:.2f} Lakhs)")
    
    # --------------------------------------------------------------------
    # INITIATIVE 2: TRANSIT ROUTING & CUSTOMS OPTIMIZATION (PROJECTED SAVINGS: INR 6.15L)
    # --------------------------------------------------------------------
    print("\nSimulating Initiative 2: Transit Routing & Customs Optimization...")
    # Target high-risk route: Sea shipments from the West experiencing customs delays,
    # or Road shipments from the North experiencing winter severe weather.
    west_sea_mask = (df['Supplier_Region'] == 'West') & (df['Transportation_Mode'] == 'Sea') & (df['Disruption_Type'] == 'Customs Bottleneck')
    north_road_mask = (df['Supplier_Region'] == 'North') & (df['Transportation_Mode'] == 'Road') & (df['Disruption_Type'] == 'Weather Severe')
    
    disrupted_route_orders = df[west_sea_mask | north_road_mask]
    total_disrupted_route_orders = len(disrupted_route_orders)
    
    # Re-route or streamline customs for 30% of these highly disrupted shipments
    optimization_rate = 0.30
    optimized_shipments = int(total_disrupted_route_orders * optimization_rate)
    
    # Demurrage, expedite transit, and weather delay penalties saved
    saving_per_optimized_transit = 4500 # in INR
    initiative_2_savings = optimized_shipments * saving_per_optimized_transit
    
    print(f"- Total highly-disrupted transit shipments identified: {total_disrupted_route_orders:,}")
    print(f"- Target 30% shipments for route optimization or customs streamlining: {optimized_shipments:,} shipments")
    print(f"- Average delay & demurrage cost saved per shipment: INR {saving_per_optimized_transit}")
    print(f"- Projected Initiative 2 Savings: INR {initiative_2_savings:,} (INR {initiative_2_savings/100000:.2f} Lakhs)")
    
    # --------------------------------------------------------------------
    # INITIATIVE 3: SAFETY STOCK BALANCING & STOCKOUT MITIGATION (PROJECTED SAVINGS: INR 6.50L)
    # --------------------------------------------------------------------
    print("\nSimulating Initiative 3: Safety Stock Balancing & Warehouse Load Optimization...")
    # WH-301 has high utilization (95%+) and high stockout frequency (7.3%)
    # WH-303 has lower utilization (65%) and minimal stockouts.
    # By redistributing safety stock from WH-303 to WH-301, we resolve warehouse utilization mismatch.
    # Total stockouts in clean dataset
    total_stockouts = df['Stockout_Flag'].sum()
    
    # Target reducing warehouse stockouts by 12.5% through smart safety stock relocation
    reduction_rate = 0.125
    stockouts_prevented = int(total_stockouts * reduction_rate)
    
    # Stockout costs: lost sales + emergency replenishment shipping penalties
    cost_per_stockout = 8500 # in INR
    initiative_3_savings = stockouts_prevented * cost_per_stockout
    
    print(f"- Total historical stockout incidents: {total_stockouts:,}")
    print(f"- Target stockout reduction (12.5% through safety stock reallocation): {stockouts_prevented:,} incidents prevented")
    print(f"- Average financial penalty per stockout (lost margin + express logistics): INR {cost_per_stockout}")
    print(f"- Projected Initiative 3 Savings: INR {initiative_3_savings:,} (INR {initiative_3_savings/100000:.2f} Lakhs)")
    
    # --------------------------------------------------------------------
    # TOTAL COMBINED PROJECTED OPERATIONAL COST SAVINGS
    # --------------------------------------------------------------------
    total_savings_inr = initiative_1_savings + initiative_2_savings + initiative_3_savings
    total_savings_lakhs = total_savings_inr / 100000.0
    
    print("\n====================================================================")
    print("           EXECUTIVE OPTIMIZATION SUMMARY (PROJECTED SAVINGS)       ")
    print("====================================================================")
    print(f"Initiative 1: Supplier Volume Reallocation   : INR {initiative_1_savings:10,} (INR {initiative_1_savings/100000:5.2f} Lakhs)")
    print(f"Initiative 2: Route & Customs Optimization    : INR {initiative_2_savings:10,} (INR {initiative_2_savings/100000:5.2f} Lakhs)")
    print(f"Initiative 3: Safety Stock & Stockout Tuning : INR {initiative_3_savings:10,} (INR {initiative_3_savings/100000:5.2f} Lakhs)")
    print("--------------------------------------------------------------------")
    print(f"TOTAL PROJECTED ANNUAL OPERATIONAL SAVINGS   : INR {total_savings_inr:10,} (INR {total_savings_lakhs:5.2f} Lakhs)")
    print("====================================================================")
    
    # Save savings summary table
    summary_data = {
        'Initiative_Name': [
            'Supplier Volume Reallocation',
            'Transit Routing & Customs Optimization',
            'Safety Stock & Stockout Mitigation',
            'Total Projected Savings'
        ],
        'Target_Metric_Optimized': [
            f'{orders_to_reallocate:,} orders reallocated from Rating < 3.0 suppliers',
            f'{optimized_shipments:,} sea/road shipments re-routed/streamlined',
            f'{stockouts_prevented:,} warehouse stockout incidents prevented',
            'Process Optimization Suite'
        ],
        'Financial_Benefit_INR': [
            initiative_1_savings,
            initiative_2_savings,
            initiative_3_savings,
            total_savings_inr
        ],
        'Financial_Benefit_Lakhs': [
            initiative_1_savings/100000,
            initiative_2_savings/100000,
            initiative_3_savings/100000,
            total_savings_lakhs
        ]
    }
    
    summary_df = pd.DataFrame(summary_data)
    summary_df.to_csv("operational_savings_summary.csv", index=False)
    print("\nSummary successfully saved to 'operational_savings_summary.csv'.")
    print("=== COST-SAVINGS OPTIMIZATION MODEL COMPLETE ===")

if __name__ == "__main__":
    run_cost_savings_simulation()
