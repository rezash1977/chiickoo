import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // 1. دریافت کل اطلاعات ورودی
    let body;
try {
  body = await req.json()
} catch {
  return new Response(
    JSON.stringify({ error: "Invalid JSON payload" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  )
}

    
    // برای دیباگ کردن در لاگ‌ها، کل محتوا را چاپ می‌کنیم تا اگر باز هم ساختار فرق داشت ببینیم
    console.log("Incoming payload:", JSON.stringify(body))

    // 2. استخراج شماره و کد OTP بر اساس ساختار استاندارد هوک سوپابیس
    const user = body.user
    const otp = body.sms?.otp // <-- تغییر مهم اینجاست (otp داخل sms است)

    if (!user || !user.phone || !otp) {
      throw new Error('Missing user phone or otp')
    }

    console.log(`Sending OTP ${otp} to ${user.phone}`);

    // 3. اصلاح فرمت شماره موبایل
    let mobileNo = user.phone.replace('+98', '0')
    if (mobileNo.startsWith('+')) {
       mobileNo = "0" + mobileNo.substring(3) 
    }

    // 4. دریافت تنظیمات از متغیرهای محیطی
    const username = Deno.env.get('SMS_USERNAME') ?? ""
    const password = Deno.env.get('SMS_PASSWORD') ?? ""
    const domain = "0098"
    const from = Deno.env.get('SMS_FROM') ?? ""
    
    // متن پیامک
    const messageText = `کد محرمانه ورود به چی کو: ${otp}`

    // 5. ساخت URL
    const params = new URLSearchParams()
    params.append("FROM", from)
    params.append("TO", mobileNo)
    params.append("TEXT", messageText)
    params.append("USERNAME", username)
    params.append("PASSWORD", password)
    params.append("DOMAIN", domain)

    const url = `https://www.0098sms.com/sendsmslink.aspx?${params.toString()}`

    // 6. ارسال درخواست به سامانه پیامکی
    const response = await fetch(url)
    const responseText = await response.text()

    console.log("Provider Response:", responseText)

    if (responseText.trim() === "0") {
        return new Response(
          JSON.stringify({ message: 'SMS sent successfully' }),
          { headers: { "Content-Type": "application/json" } },
        )
    } else {
        console.error(`SMS Failed with code: ${responseText}`);
        return new Response(
          JSON.stringify({ error: `SMS Provider Error Code: ${responseText}` }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

  } catch (error) {
    console.error("Function Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }
})