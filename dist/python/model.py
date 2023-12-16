import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report

def train_spam_detector(dataset_path):
    # Load the dataset (CSV format with 'text' and 'label' columns)
    df = pd.read_csv(dataset_path)

    # Split the dataset into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)

    # Vectorize the email text using CountVectorizer
    vectorizer = CountVectorizer()
    X_train_vectorized = vectorizer.fit_transform(X_train)
    X_test_vectorized = vectorizer.transform(X_test)

    # Train a Naive Bayes classifier
    classifier = MultinomialNB()
    classifier.fit(X_train_vectorized, y_train)

    # Evaluate the model
    y_pred = classifier.predict(X_test_vectorized)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.2f}")

    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    return vectorizer, classifier

def predict_spam(vectorizer, classifier, email_text):
    # Vectorize the input email text
    email_vectorized = vectorizer.transform([email_text])

    # Predict whether the email is spam or not
    prediction = classifier.predict(email_vectorized)[0]

    return prediction

# Example usage:
# Assuming you have a CSV file 'spam_dataset.csv' with columns 'text' and 'label'
# where 'text' contains email text and 'label' is 0 for ham and 1 for spam.

# Train the spam detector
vectorizer, classifier = train_spam_detector('spam_dataset.csv')

# Example email text to classify
new_email_text = "Congratulations! You've won a free vacation!"

# Predict whether the email is spam or not
prediction = predict_spam(vectorizer, classifier, new_email_text)

# Output the prediction
print(f"The email is {'spam' if prediction == 1 else 'not spam'}.")
