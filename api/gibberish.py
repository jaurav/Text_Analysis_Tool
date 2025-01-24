import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


# Load the tokenizer and model for gibberish detection
gibberish_tokenizer = AutoTokenizer.from_pretrained("wajidlinux99/gibberish-text-detector", use_auth_token="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")
gibberish_model = AutoModelForSequenceClassification.from_pretrained("wajidlinux99/gibberish-text-detector", use_auth_token="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")

def classify_gibberish(text):
    """
    Classifies whether the input text is gibberish or clean.
    
    Args:
        text (str): The input string to classify.
    
    Returns:
        dict: A dictionary with the gibberish and clean probabilities.
    """
    # Encode the input text
    inputs = gibberish_tokenizer(text, return_tensors="pt", truncation=True, max_length=512)

    # Perform inference
    with torch.no_grad():
        outputs = gibberish_model(**inputs)
    
    # Get the logits and compute probabilities
    logits = outputs.logits
    probabilities = torch.softmax(logits, dim=1).squeeze()

    # Get the predicted class (0 for clean, 1 for gibberish)
    predicted_class = torch.argmax(probabilities).item()
    
    if (probabilities[1].item() < 0.2) & (probabilities[0].item() < 0.2):
        # If confidence is below threshold, return uncertain or some custom message
        return {
            "label": "gibberish",
            "gibberish_probability": f"{probabilities[1].item():.3f}",
            "clean_probability": f"{probabilities[0].item():.3f}"
        }
    else:
        label = "gibberish" if predicted_class == 1 else "clean"
        
        return {
        "label": label,
        "gibberish_probability": f"{probabilities[1].item():.3f}",
        "clean_probability": f"{probabilities[0].item():.3f}"
        }

