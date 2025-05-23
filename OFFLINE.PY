from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Load from local
model = GPT2LMHeadModel.from_pretrained("./gpt2_offline")
tokenizer = GPT2Tokenizer.from_pretrained("./gpt2_offline")

# Generate some text
input_text = "Once upon a time"
inputs = tokenizer.encode(input_text, return_tensors='pt')
outputs = model.generate(inputs, max_length=50, num_return_sequences=1)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
