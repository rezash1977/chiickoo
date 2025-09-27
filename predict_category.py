import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import json

class AdClassifier:
    def __init__(self, model_path="./ad_classifier"):
        self.model_path = model_path
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.eval()
        
        # تعریف دسته‌بندی‌ها
        self.categories = [
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
        
        self.id2label = {idx: cat for idx, cat in enumerate(self.categories)}
        
    def predict(self, title, description):
        """
        پیش‌بینی دسته‌بندی بر اساس عنوان و توضیحات آگهی
        
        Args:
            title (str): عنوان آگهی
            description (str): توضیحات آگهی
            
        Returns:
            dict: شامل دسته‌بندی پیش‌بینی شده و درصد اطمینان
        """
        # ترکیب عنوان و توضیحات
        text = title + " " + description
        
        # Tokenize
        inputs = self.tokenizer(
            text, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=256
        )
        
        # پیش‌بینی
        with torch.no_grad():
            outputs = self.model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            predicted_class = torch.argmax(predictions, dim=1).item()
            confidence = predictions[0][predicted_class].item()
        
        # نام فارسی دسته‌بندی
        category_names = {
            'shop_rent': 'اجاره مغازه و غرفه',
            'shop_sale': 'فروش مغازه و غرفه',
            'office_rent': 'اجاره دفتر، اتاق اداری، مطب',
            'industrial': 'دفتر صنعتی، کشاورزی، تجاری',
            'apartment_rent': 'اجاره آپارتمان',
            'apartment_sale': 'فروش آپارتمان',
            'villa_rent': 'اجاره ویلا',
            'villa_sale': 'فروش ویلا',
            'land': 'زمین'
        }
        
        predicted_category = self.id2label[predicted_class]
        
        return {
            'category': predicted_category,
            'category_name': category_names[predicted_category],
            'confidence': confidence,
            'all_predictions': {
                cat: predictions[0][idx].item() 
                for idx, cat in enumerate(self.categories)
            }
        }
    
    def predict_batch(self, ads_list):
        """
        پیش‌بینی دسته‌بندی برای چندین آگهی
        
        Args:
            ads_list (list): لیست آگهی‌ها، هر آگهی شامل title و description
            
        Returns:
            list: لیست نتایج پیش‌بینی
        """
        results = []
        for ad in ads_list:
            result = self.predict(ad['title'], ad['description'])
            results.append(result)
        return results

# مثال استفاده
if __name__ == "__main__":
    # بارگذاری مدل
    classifier = AdClassifier()
    
    # تست با چند نمونه
    test_ads = [
        {
            "title": "اجاره مغازه در مرکز شهر",
            "description": "مغازه 50 متری در مرکز خرید با موقعیت عالی"
        },
        {
            "title": "فروش آپارتمان 2 خوابه",
            "description": "آپارتمان 80 متری در ونک با قیمت مناسب"
        },
        {
            "title": "اجاره دفتر اداری",
            "description": "دفتر 100 متری در مرکز شهر آماده تحویل"
        }
    ]
    
    print("نتایج پیش‌بینی:")
    print("=" * 60)
    
    for i, ad in enumerate(test_ads, 1):
        result = classifier.predict(ad['title'], ad['description'])
        print(f"آگهی {i}:")
        print(f"عنوان: {ad['title']}")
        print(f"توضیحات: {ad['description']}")
        print(f"دسته‌بندی: {result['category_name']}")
        print(f"اطمینان: {result['confidence']:.2f}")
        print("-" * 40)
    
    # تست batch prediction
    print("\nنتایج Batch Prediction:")
    print("=" * 60)
    batch_results = classifier.predict_batch(test_ads)
    for i, result in enumerate(batch_results, 1):
        print(f"آگهی {i}: {result['category_name']} ({result['confidence']:.2f})") 