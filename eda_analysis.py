import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

def run_eda(input_path="clean_supply_chain_data.csv", output_dir="visualizations"):
    print("=== STARTING EXPLORATORY DATA ANALYSIS (EDA) ===")
    
    # 1. Load Clean Dataset
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
        
    df = pd.read_csv(input_path)
    print(f"Loaded dataset of shape: {df.shape}")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Apply elegant style & theme
    sns.set_theme(style="whitegrid")
    plt.rcParams.update({
        'font.size': 12,
        'axes.labelsize': 13,
        'axes.titlesize': 15,
        'xtick.labelsize': 11,
        'ytick.labelsize': 11,
        'figure.titlesize': 16,
        'font.family': 'sans-serif'
    })
    
    # Color palette
    brand_palette = ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']
    sns.set_palette(sns.color_palette(brand_palette))
    
    # Calculate some high-level metrics for validation
    total_orders = len(df)
    otdr = (df['On_Time_Delivery'].sum() / total_orders) * 100
    avg_fill_rate = df['Order_Fill_Rate_Pct'].mean()
    total_stockouts = df['Stockout_Flag'].sum()
    stockout_pct = (total_stockouts / total_orders) * 100
    avg_lead_time = df['Supplier_Lead_Time_Days'].mean()
    total_trans_cost = df['Transportation_Cost_INR'].sum()
    
    print("\n--- Operational KPI Summary ---")
    print(f"Total Shipments Analyzed: {total_orders:,}")
    print(f"On-Time Delivery Rate (OTDR): {otdr:.2f}%")
    print(f"Average Order Fill Rate: {avg_fill_rate:.2f}%")
    print(f"Total Stockout Occurrences: {total_stockouts:,} ({stockout_pct:.2f}%)")
    print(f"Average Supplier Lead Time: {avg_lead_time:.2f} days")
    print(f"Total Transportation Cost: INR {total_trans_cost/10000000:.2f} Crores (INR {total_trans_cost/100000:.2f} Lakhs)")
    
    # Plot 1: Distribution of Delivery Delays by Supplier Region
    print("\nGenerating Plot 1: Delivery Delay Distribution...")
    plt.figure(figsize=(10, 6))
    
    # Filtering for delayed shipments (Lead Time Variance > 0)
    delays_df = df[df['Lead_Time_Variance'] > 0]
    
    sns.boxplot(
        data=delays_df, 
        x='Supplier_Region', 
        y='Lead_Time_Variance', 
        palette=['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        linewidth=2,
        fliersize=3
    )
    plt.title("Distribution of Delivery Delays (Variance) by Supplier Region", pad=15)
    plt.xlabel("Supplier Region")
    plt.ylabel("Lead Time Variance (Actual - Expected Days)")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "01_delivery_delays_by_region.png"), dpi=150)
    plt.close()
    
    # Plot 2: Supplier Performance Bottleneck Analysis
    # Let's analyze average Lead Time and Delayed Shipment Percentage per supplier
    print("Generating Plot 2: Supplier Bottleneck Analysis...")
    supplier_stats = df.groupby('Supplier_Name').agg(
        Avg_Lead_Time=('Supplier_Lead_Time_Days', 'mean'),
        Delayed_Shipment_Pct=('Delayed_Shipment', lambda x: x.mean() * 100),
        Avg_Rating=('Supplier_Rating', 'mean')
    ).reset_index().sort_values(by='Avg_Lead_Time', ascending=False)
    
    plt.figure(figsize=(11, 7))
    ax = sns.barplot(
        data=supplier_stats,
        y='Supplier_Name',
        x='Avg_Lead_Time',
        palette='coolwarm_r',
        hue='Supplier_Name',
        legend=False
    )
    
    # Add actual percentages as labels next to the bars
    for i, p in enumerate(ax.patches):
        width = p.get_width()
        delayed_pct = supplier_stats.iloc[i]['Delayed_Shipment_Pct']
        rating = supplier_stats.iloc[i]['Avg_Rating']
        ax.text(
            width + 0.3,
            p.get_y() + p.get_height() / 2,
            f"{width:.1f}d ({delayed_pct:.1f}% delay, {rating:.1f}★)",
            ha='left',
            va='center',
            fontsize=10,
            color='#333333'
        )
        
    plt.title("Supplier Bottleneck Profile: Average Lead Time & Failure Metrics", pad=20)
    plt.xlabel("Average Lead Time (Days)")
    plt.ylabel("Supplier Name")
    plt.xlim(0, max(supplier_stats['Avg_Lead_Time']) + 4)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "02_supplier_bottlenecks.png"), dpi=150)
    plt.close()
    
    # Plot 3: Warehouse Utilization vs. Stockout Frequencies
    print("Generating Plot 3: Warehouse Utilization & Stockout Frequency...")
    wh_stats = df.groupby('Warehouse_ID').agg(
        Avg_Utilization=('Warehouse_Utilization_Rate', lambda x: x.mean() * 100),
        Stockout_Rate=('Stockout_Flag', lambda x: x.mean() * 100)
    ).reset_index()
    
    fig, ax1 = plt.subplots(figsize=(10, 6))
    
    # Primary axis for Warehouse Utilization Rate
    ax1 = sns.barplot(
        data=wh_stats,
        x='Warehouse_ID',
        y='Avg_Utilization',
        color='#3b82f6',
        alpha=0.8,
        ax=ax1
    )
    ax1.set_xlabel("Warehouse Identifier", labelpad=10)
    ax1.set_ylabel("Average Capacity Utilization Rate (%)", color='#1e3a8a')
    ax1.tick_params(axis='y', labelcolor='#1e3a8a')
    ax1.set_ylim(0, 100)
    
    # Secondary axis for Stockout Frequency Rate
    ax2 = ax1.twinx()
    sns.lineplot(
        data=wh_stats,
        x='Warehouse_ID',
        y='Stockout_Rate',
        color='#ef4444',
        marker='o',
        linewidth=3,
        markersize=10,
        ax=ax2
    )
    ax2.set_ylabel("Stockout Frequency Rate (%)", color='#ef4444')
    ax2.tick_params(axis='y', labelcolor='#ef4444')
    ax2.set_ylim(0, max(wh_stats['Stockout_Rate']) + 2)
    ax2.grid(False) # Prevent overlapping gridlines
    
    plt.title("Warehouse Operational Stress Profile: Capacity Utilization vs. Stockouts", pad=20)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "03_warehouse_utilization_stockout.png"), dpi=150)
    plt.close()
    
    # Plot 4: Disruption Heatmap by Region & Mode of Transportation
    print("Generating Plot 4: Disruption Heatmap...")
    # Calculate average disruption impact (days of delay) or disruption count
    # Let's filter for rows where Disruption_Type != 'None'
    disruption_df = df[df['Disruption_Type'] != 'None']
    heatmap_data = disruption_df.groupby(['Supplier_Region', 'Transportation_Mode'])['Disruption_Impact_Days'].mean().unstack().fillna(0)
    
    plt.figure(figsize=(10, 6))
    sns.heatmap(
        heatmap_data,
        annot=True,
        fmt=".1f",
        cmap="YlOrRd",
        linewidths=0.5,
        cbar_kws={'label': 'Average Delay (Days)'},
        annot_kws={"size": 12, "weight": "bold"}
    )
    plt.title("Disruption Hotspots: Average Delay Impact by Region & Transit Mode", pad=20)
    plt.xlabel("Transportation Mode")
    plt.ylabel("Supplier Region")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "04_disruption_hotspot_heatmap.png"), dpi=150)
    plt.close()
    
    print(f"All EDA visualizations successfully saved to the '{output_dir}/' directory.")
    print("=== EXPLORATORY DATA ANALYSIS (EDA) COMPLETE ===")

if __name__ == "__main__":
    run_eda()
