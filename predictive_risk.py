import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def train_and_predict(df: pd.DataFrame, target: str = "disruption_flag"):
    """Train a RandomForest model to predict supply‑chain disruption.

    Parameters
    ----------
    df: pd.DataFrame
        Cleaned dataset containing numeric and categorical features.
    target: str, default "disruption_flag"
        Column indicating whether a record experienced a disruption (0/1).

    Returns
    -------
    model: RandomForestClassifier
        Trained model object.
    predictions: pd.Series
        Predicted labels for the test set.
    report: str
        Classification report string.
    """
    # Basic preprocessing – encode categoricals with one‑hot
    X = pd.get_dummies(df.drop(columns=[target]), drop_first=True)
    y = df[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    report = classification_report(y_test, preds)
    return model, pd.Series(preds, index=y_test.index), report

if __name__ == "__main__":
    # Quick demo when run directly
    df_path = "cleaned_data.csv"
    df = pd.read_csv(df_path)
    model, preds, report = train_and_predict(df)
    print("\n=== Classification Report ===\n", report)
    # Save model for later API use
    import joblib
    joblib.dump(model, "predictive_risk_model.pkl")
    print("Model saved to predictive_risk_model.pkl")
