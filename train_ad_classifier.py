import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import Dataset
import pandas as pd
from sklearn.model_selection import train_test_split
import numpy as np

# تعریف دسته‌بندی‌ها
categories = [
    'shop_rent',      # اجاره مغازه و غرفه
    'shop_sale',      # فروش مغازه و غرفه  
    'office_rent',    # اجاره دفتر، اتاق اداری، مطب
    'industrial',     # دفتر صنعتی، کشاورزی، تجاری
    'apartment_rent', # اجاره آپارتمان
    'apartment_sale', # فروش آپارتمان
    'villa_rent',     # اجاره ویلا
    'villa_sale',     # فروش ویلا
    'land'            # زمین
]

# داده‌های آموزشی (نمونه‌های واقعی)
training_data = [
    # اجاره مغازه
    {"title": "اجاره مغازه در مرکز شهر", "description": "مغازه 50 متری در مرکز خرید", "category": "shop_rent"},
    {"title": "اجاره غرفه در پاساژ", "description": "غرفه آماده در پاساژ معتبر", "category": "shop_rent"},
    {"title": "اجاره دکان در خیابان اصلی", "description": "دکان با موقعیت عالی", "category": "shop_rent"},
    
    # فروش مغازه
    {"title": "فروش مغازه در ونک", "description": "مغازه 80 متری با قیمت مناسب", "category": "shop_sale"},
    {"title": "فروش غرفه در مرکز خرید", "description": "غرفه با سود بالا", "category": "shop_sale"},
    
    # اجاره دفتر
    {"title": "اجاره دفتر در مرکز شهر", "description": "دفتر اداری 100 متری", "category": "office_rent"},
    {"title": "اجاره اتاق کار", "description": "اتاق کار آماده در برج اداری", "category": "office_rent"},
    {"title": "اجاره مطب پزشکی", "description": "مطب آماده در مرکز درمانی", "category": "office_rent"},
    
    # صنعتی
    {"title": "اجاره دفتر صنعتی", "description": "دفتر در منطقه صنعتی", "category": "industrial"},
    {"title": "فروش زمین کشاورزی", "description": "زمین کشاورزی 5000 متری", "category": "industrial"},
    {"title": "اجاره کارخانه", "description": "کارخانه آماده در شهرک صنعتی", "category": "industrial"},
    
    # اجاره آپارتمان
    {"title": "اجاره آپارتمان 2 خوابه", "description": "آپارتمان 80 متری در ونک", "category": "apartment_rent"},
    {"title": "اجاره سوئیت", "description": "سوئیت یک خوابه آماده", "category": "apartment_rent"},
    {"title": "اجاره آپارتمان مبله", "description": "آپارتمان مبله در مرکز شهر", "category": "apartment_rent"},
    
    # فروش آپارتمان
    {"title": "فروش آپارتمان 3 خوابه", "description": "آپارتمان 120 متری در لواسان", "category": "apartment_sale"},
    {"title": "فروش سوئیت", "description": "سوئیت یک خوابه با قیمت مناسب", "category": "apartment_sale"},
    
    # اجاره ویلا
    {"title": "اجاره ویلا در لواسان", "description": "ویلا 3 خوابه با باغچه", "category": "villa_rent"},
    {"title": "اجاره خانه ویلایی", "description": "خانه ویلایی در منطقه آرام", "category": "villa_rent"},
    
    # فروش ویلا
    {"title": "فروش ویلا در فشم", "description": "ویلا 4 خوابه با استخر", "category": "villa_sale"},
    {"title": "فروش خانه ویلایی", "description": "خانه ویلایی در منطقه لوکس", "category": "villa_sale"},
    
    # زمین
    {"title": "فروش زمین مسکونی", "description": "زمین 500 متری در منطقه مسکونی", "category": "land"},
    {"title": "فروش پارکینگ", "description": "پارکینگ در مجتمع مسکونی", "category": "land"},
    {"title": "فروش انباری", "description": "انباری 20 متری", "category": "land"},
]

# تبدیل به DataFrame
df = pd.DataFrame(training_data)

# ایجاد label mapping
label2id = {cat: idx for idx, cat in enumerate(categories)}
id2label = {idx: cat for cat, idx in label2id.items()}

# اضافه کردن label_id
df['label'] = df['category'].map(label2id)

# ترکیب عنوان و توضیحات
df['text'] = df['title'] + ' ' + df['description']

# تقسیم داده‌ها
train_df, eval_df = train_test_split(df, test_size=0.2, random_state=42)

# تبدیل به Dataset
train_dataset = Dataset.from_pandas(train_df)
eval_dataset = Dataset.from_pandas(eval_df)

# تنظیم tokenizer
model_name = "bert-base-multilingual-cased"  # مدل چندزبانه
tokenizer = AutoTokenizer.from_pretrained(model_name)

# تابع tokenization
def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=256)

# Tokenize datasets
tokenized_train = train_dataset.map(tokenize_function, batched=True)
tokenized_eval = eval_dataset.map(tokenize_function, batched=True)

# تنظیم مدل
model = AutoModelForSequenceClassification.from_pretrained(
    model_name, 
    num_labels=len(categories),
    id2label=id2label,
    label2id=label2id
)

# تنظیمات آموزش
training_args = TrainingArguments(
    output_dir="./ad_classifier",
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    push_to_hub=False,  # اگر می‌خواهید به Hugging Face آپلود کنید، True کنید
)

# Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_eval,
    tokenizer=tokenizer,
)

# آموزش مدل
print("شروع آموزش مدل...")
trainer.train()

# ذخیره مدل
model.save_pretrained("./ad_classifier")
tokenizer.save_pretrained("./ad_classifier")

print("مدل با موفقیت آموزش داده و ذخیره شد!")

# تست مدل
def predict_category(title, description):
    text = title + " " + description
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=256)
    
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        predicted_class = torch.argmax(predictions, dim=1).item()
    
    return id2label[predicted_class], predictions[0][predicted_class].item()

# تست با چند نمونه
test_cases = [
    ("اجاره مغازه در مرکز شهر", "مغازه 50 متری در مرکز خرید"),
    ("فروش آپارتمان 2 خوابه", "آپارتمان 80 متری در ونک"),
    ("اجاره دفتر اداری", "دفتر 100 متری در مرکز شهر"),
]

print("\nنتایج تست:")
for title, desc in test_cases:
    category, confidence = predict_category(title, desc)
    print(f"عنوان: {title}")
    print(f"دسته‌بندی: {category}")
    print(f"اطمینان: {confidence:.2f}")
    print("-" * 50) 