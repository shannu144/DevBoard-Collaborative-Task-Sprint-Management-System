import json
import pandas as pd

# Simple rule‑based playbook generator

def generate_playbook(kpi_df: pd.DataFrame, thresholds: dict) -> list:
    """Generate mitigation actions for any KPI that breaches its threshold.

    Args:
        kpi_df (pd.DataFrame): DataFrame with KPI names as columns and latest values as rows.
        thresholds (dict): Mapping of KPI name -> numeric threshold.

    Returns:
        list: List of dictionaries describing actions.
    """
    actions = []
    for kpi, value in kpi_df.iloc[0].items():
        thresh = thresholds.get(kpi)
        if thresh is not None and value < thresh:
            actions.append({
                "kpi": kpi,
                "current_value": float(value),
                "threshold": float(thresh),
                "action": f"Investigate root cause and adjust supplier contracts for {kpi}.",
                "priority": "high" if value < 0.5 * thresh else "medium"
            })
    return actions

if __name__ == "__main__":
    # Example usage
    sample_df = pd.DataFrame({
        "on_time_delivery_rate": [0.78],
        "inventory_turnover": [1.2],
        "order_fill_rate": [0.65]
    })
    sample_thresholds = {
        "on_time_delivery_rate": 0.85,
        "inventory_turnover": 2.0,
        "order_fill_rate": 0.80
    }
    playbook = generate_playbook(sample_df, sample_thresholds)
    print(json.dumps(playbook, indent=2))
