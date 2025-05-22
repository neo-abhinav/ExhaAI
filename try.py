from transformers import pipeline

generator = pipeline("text-generation", model="BAGEL-7B-MoT")
print(generator("Hello, I am a bot,", max_length=50))
