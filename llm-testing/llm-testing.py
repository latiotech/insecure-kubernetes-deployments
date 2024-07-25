import requests
from llm_guard import scan_output, scan_prompt
from llm_guard.input_scanners import Anonymize, PromptInjection, TokenLimit, Toxicity
from llm_guard.output_scanners import Deanonymize, NoRefusal, Relevance, Sensitive
from llm_guard.vault import Vault

vault = Vault()
input_scanners = [Anonymize(vault), Toxicity(), TokenLimit(), PromptInjection()]
output_scanners = [Deanonymize(vault), NoRefusal(), Relevance(), Sensitive()]

def query(payload, model_id, api_token):
    headers = {"Authorization": f"Bearer {api_token}"}
    API_URL = f"https://api-inference.huggingface.co/models/{model_id}"
    response = requests.post(API_URL, headers=headers, json={"inputs": payload}, timeout=60)
    response_text = response.text
    
    sanitized_response_text, results_valid, results_score = scan_output(
        output_scanners, sanitized_prompt, response_text
    )
    
    if any(results_valid.values()) is False:
        print(f"Output {response_text} is not valid, scores: {results_score}")
        exit(1)
    
    return sanitized_response_text

model_id = "Writer/palmyra-small"
api_token = "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" # Replace 'your_api_token_here' with your actual Hugging Face API token.
prompt = "who is elon musk?"
sanitized_prompt, results_valid, results_score = scan_prompt(input_scanners, prompt)
sanitized_response = query(sanitized_prompt, model_id, api_token)
sanitized_response = query(prompt, model_id, api_token)

print(sanitized_response)
