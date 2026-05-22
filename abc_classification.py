import pandas as pd
import matplotlib.pyplot as plt
import os

def abc_classification(df: pd.DataFrame, value_column: str = "inventory_value", top_pct: float = 0.8, mid_pct: float = 0.15) -> pd.DataFrame:
    """Classify inventory items into ABC categories.

    Parameters
    ----------
    df: pd.DataFrame
        DataFrame containing at least the column specified by `value_column`.
    value_column: str, default "inventory_value"
        Column representing the monetary value of each inventory item.
    top_pct: float, default 0.8
        Cumulative percentage threshold for class A items.
    mid_pct: float, default 0.15
        Cumulative percentage threshold for class B items (after A).

    Returns
    -------
    pd.DataFrame
        Original DataFrame with an additional 'ABC_class' column.
    """
    # Sort items by descending value
    df_sorted = df.sort_values(by=value_column, ascending=False).reset_index(drop=True)
    total_value = df_sorted[value_column].sum()
    df_sorted['cum_value'] = df_sorted[value_column].cumsum() / total_value
    # Assign classes based on cumulative thresholds
    conditions = [
        df_sorted['cum_value'] <= top_pct,
        df_sorted['cum_value'].between(top_pct, top_pct + mid_pct, inclusive='right')
    ]
    choices = ['A', 'B']
    df_sorted['ABC_class'] = pd.Series(pd.np.select(conditions, choices, default='C'))
    # Plot Pareto curve
    plt.figure(figsize=(8, 5))
    plt.plot(df_sorted.index + 1, df_sorted['cum_value'] * 100, marker='o')
    plt.axhline(top_pct * 100, color='green', linestyle='--', label='A threshold')
    plt.axhline((top_pct + mid_pct) * 100, color='orange', linestyle='--', label='B threshold')
    plt.title('Pareto Curve – Cumulative Inventory Value')
    plt.xlabel('Items (sorted by value)')
    plt.ylabel('Cumulative Value (%)')
    plt.legend()
    os.makedirs('visualizations', exist_ok=True)
    plt_path = os.path.join('visualizations', 'abc_pareto.png')
    plt.savefig(plt_path, dpi=150)
    plt.close()
    return df_sorted.drop(columns=['cum_value'])

if __name__ == "__main__":
    # Demo execution
    sample_data = pd.DataFrame({
        "item_id": range(1, 101),
        "inventory_value": pd.np.random.lognormal(mean=10, sigma=2, size=100)
    })
    result = abc_classification(sample_data)
    result.to_csv('abc_segments.csv', index=False)
    print('ABC classification saved to abc_segments.csv and Pareto plot to visualizations/abc_pareto.png')
