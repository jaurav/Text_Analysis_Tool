import torch
from transformers import RobertaTokenizer, RobertaForSequenceClassification, AutoModelForSequenceClassification, AutoTokenizer

# Load the tokenizer and model for toxicity classification
toxicity_tokenizer = RobertaTokenizer.from_pretrained('s-nlp/roberta_toxicity_classifier')
toxicity_model = RobertaForSequenceClassification.from_pretrained('s-nlp/roberta_toxicity_classifier')

def classify_toxicity(text):
    """
    Classifies the toxicity of the input text.
    
    Args:
        text (str): The input string to classify.
    
    Returns:
        dict: A dictionary with the label and its corresponding probability.
    """
    # Encode the input text
    inputs = toxicity_tokenizer.encode(text, return_tensors="pt", truncation=True, max_length=512)

    # Perform inference
    with torch.no_grad():
        outputs = toxicity_model(inputs)
    
    # Get the logits and compute probabilities
    logits = outputs.logits
    probabilities = torch.softmax(logits, dim=1).squeeze()

    # Get the predicted class (0 for neutral, 1 for toxic)
    predicted_class = torch.argmax(probabilities).item()

    # Map the class to a label
    label = "toxic" if predicted_class == 1 else "neutral"

    return {
        "label": label,
        "neutral_probability": f"{probabilities[0].item():.3f}",
        "toxic_probability": f"{probabilities[1].item():.3f}"
    }