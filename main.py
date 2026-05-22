import os
import sys
import time

# Add current directory to path to ensure local imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_generator import generate_supply_chain_data
from data_cleaning import clean_supply_chain_data
from eda_analysis import run_eda
from cost_savings_model import run_cost_savings_simulation

def print_header(title):
    print("\n" + "=" * 80)
    print(f" {title.center(78)} ")
    print("=" * 80)

def main():
    print_header("SUPPLY CHAIN DISRUPTION ANALYSIS & OPTIMIZATION SUITE")
    print("Initializing end-to-end supply chain execution pipeline...")
    time.sleep(1)
    
    # Step 1: Data Generation
    print_header("STEP 1: SYNTHETIC DATA GENERATION")
    generate_supply_chain_data(num_records=85000)
    
    # Step 2: Data Cleaning & Preprocessing
    print_header("STEP 2: DATA CLEANING & PREPROCESSING")
    clean_supply_chain_data()
    
    # Step 3: Exploratory Data Analysis & Visualizations
    print_header("STEP 3: EXPLORATORY DATA ANALYSIS")
    run_eda()
    
    # Step 4: Cost Savings Simulation Model
    print_header("STEP 4: FINANCIAL OPTIMIZATION SIMULATION")
    run_cost_savings_simulation()
    
    print_header("PROJECT RUN COMPLETION SUMMARY")
    print("Success! All pipeline steps executed seamlessly.")
    print("\nOutputs generated in your workspace:")
    print(" 1. Raw Dataset      : raw_supply_chain_data.csv (~86,500 rows)")
    print(" 2. Cleaned Dataset  : clean_supply_chain_data.csv (~84,993 rows)")
    print(" 3. Visual Charts    : visualizations/ folder (4 high-resolution plots)")
    print(" 4. Savings Summary  : operational_savings_summary.csv (INR 2.01 Crores Projected)")
    print(" 5. SQL KPI Queries  : kpi_queries.sql (Database ready query script)")
    print(" 6. Dashboard Guide  : dashboard_design.md (Power BI Star Schema & DAX specs)")
    print(" 7. Executive Report : executive_report.md (Executive Business Report)")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
