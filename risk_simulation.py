import pandas as pd
import numpy as np
import os
from tqdm import tqdm

# Settings
N_SIMULATIONS = 10000
OUTPUT_CSV = "risk_metrics.csv"

def simulate_one_run(df: pd.DataFrame) -> dict:
    """Perform a single Monte‑Carlo run.
    Returns a dict with key metrics for this run.
    """
    # Sample lead time and demand distributions from historical data
    lead_times = df["lead_time_days"].dropna()
    demand = df["order_quantity"].dropna()
    sampled_lead = np.random.choice(lead_times)
    sampled_demand = np.random.choice(demand)
    # Simple inventory policy: reorder point = mean demand * lead_time + safety stock
    safety_stock = sampled_demand * 0.2  # 20% safety
    reorder_point = sampled_demand * sampled_lead + safety_stock
    # Simulate stock level after demand
    initial_stock = df["current_stock"].median()
    ending_stock = initial_stock - sampled_demand
    stockout = ending_stock < 0
    # Estimate shortage cost (assume $50 per unit short)
    shortage_cost = abs(ending_stock) * 50 if stockout else 0
    return {
        "stockout": int(stockout),
        "shortage_cost": shortage_cost,
        "reorder_point": reorder_point,
    }

def run_simulation(df: pd.DataFrame) -> pd.DataFrame:
    results = []
    for _ in tqdm(range(N_SIMULATIONS), desc="Monte‑Carlo Simulations"):
        results.append(simulate_one_run(df))
    return pd.DataFrame(results)

if __name__ == "__main__":
    data_path = "cleaned_data.csv"
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"{data_path} not found. Run the cleaning pipeline first.")
    df = pd.read_csv(data_path)
    sim_df = run_simulation(df)
    # Aggregate metrics
    prob_stockout = sim_df["stockout"].mean()
    expected_shortage = sim_df["shortage_cost"].mean()
    summary = pd.DataFrame({
        "prob_stockout": [prob_stockout],
        "expected_shortage_cost": [expected_shortage]
    })
    summary.to_csv(OUTPUT_CSV, index=False)
    print(f"Monte‑Carlo risk metrics saved to {OUTPUT_CSV}")
