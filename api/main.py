from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Ad Category Classifier API")

# اضافه کردن CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# الگوریتم پیشنهاد دسته‌بندی بر اساس کلمات کلیدی
categoryKeywords = [
    { "slug": "shop_rent", "keywords": ["اجاره", "مغازه", "غرفه", "دکان"] },
    { "slug": "shop_sale", "keywords": ["فروش", "مغازه", "غرفه", "دکان"] },
    { "slug": "office_rent", "keywords": ["اجاره", "دفتر", "اداری", "مطب", "اتاق کار", "کلینیک"] },
    { "slug": "industrial", "keywords": ["صنعتی", "کشاورزی", "تجاری", "کارخانه"] },
    { "slug": "apartment_rent", "keywords": ["اجاره", "آپارتمان", "سوئیت"] },
    { "slug": "apartment_sale", "keywords": ["فروش", "آپارتمان", "سوئیت"] },
    { "slug": "villa_rent", "keywords": ["اجاره", "ویلا", "خانه", "خانه ویلایی"] },
    { "slug": "villa_sale", "keywords": ["فروش", "ویلا", "خانه", "خانه ویلایی"] },
    { "slug": "land", "keywords": ["زمین", "پارکینگ", "انباری"] },
]

def suggestCategories(title, description):
    if not title:
        return []
    
    text = (title + " " + description).lower()
    suggested = []
    
    for cat in categoryKeywords:
        if any(keyword in text for keyword in cat["keywords"]):
            suggested.append(cat["slug"])
    
    return suggested

class AdRequest(BaseModel):
    title: str
    description: str

class AdResponse(BaseModel):
    category: str
    category_name: str
    confidence: float
    all_predictions: dict

@app.post("/predict-category", response_model=AdResponse)
async def predict_category(request: AdRequest):
    """
    پیش‌بینی دسته‌بندی آگهی بر اساس عنوان و توضیحات
    """
    try:
        suggested_slugs = suggestCategories(request.title, request.description)
        
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
        
        # اگر پیشنهادی پیدا شد، اولین را برگردان
        if suggested_slugs:
            predicted_category = suggested_slugs[0]
            confidence = 0.8  # اطمینان بالا برای کلمات کلیدی
        else:
            predicted_category = "apartment_rent"  # پیش‌فرض
            confidence = 0.3  # اطمینان پایین
        
        # شبیه‌سازی all_predictions
        all_predictions = {}
        for cat in categoryKeywords:
            all_predictions[cat["slug"]] = 0.1 if cat["slug"] != predicted_category else confidence
        
        return AdResponse(
            category=predicted_category,
            category_name=category_names[predicted_category],
            confidence=confidence,
            all_predictions=all_predictions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در پیش‌بینی: {str(e)}")

@app.get("/health")
async def health_check():
    """
    بررسی وضعیت API
    """
    return {"status": "healthy", "model_loaded": True}

@app.get("/categories")
async def get_categories():
    """
    دریافت لیست تمام دسته‌بندی‌های موجود
    """
    categories = [
        {"slug": "shop_rent", "name": "اجاره مغازه و غرفه"},
        {"slug": "shop_sale", "name": "فروش مغازه و غرفه"},
        {"slug": "office_rent", "name": "اجاره دفتر، اتاق اداری، مطب"},
        {"slug": "industrial", "name": "دفتر صنعتی، کشاورزی، تجاری"},
        {"slug": "apartment_rent", "name": "اجاره آپارتمان"},
        {"slug": "apartment_sale", "name": "فروش آپارتمان"},
        {"slug": "villa_rent", "name": "اجاره ویلا"},
        {"slug": "villa_sale", "name": "فروش ویلا"},
        {"slug": "land", "name": "زمین"}
    ]
    return {"categories": categories}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 