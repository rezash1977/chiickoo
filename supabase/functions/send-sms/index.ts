// Supabase Custom SMS Hook - 0098VIP
// Deploy: supabase functions deploy send-sms --no-verify-jwt

// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    console.log("[HOOK] Full Payload:", JSON.stringify(payload));

    // ==============================
    // Extract phone
    // ==============================
    const phone =
      payload?.user?.phone ??
      payload?.phone ??
      null;

    // ==============================
    // Extract OTP
    // ==============================
    const otp =
      payload?.sms?.otp ??
      payload?.otp ??
      payload?.token ??
      null;

    console.log("[HOOK] Extracted phone:", phone);
    console.log("[HOOK] Extracted otp:", otp);

    if (!phone || !otp) {
      console.error("[HOOK] Missing phone or otp");

      return successResponse("missing_data");
    }

    // ==============================
    // Convert phone to 09xxxxxxxxx
    // ==============================
    let localPhone = phone.trim();

    if (localPhone.startsWith("+98")) {
      localPhone = "0" + localPhone.substring(3);
    } else if (localPhone.startsWith("0098")) {
      localPhone = "0" + localPhone.substring(4);
    } else if (localPhone.startsWith("98")) {
      localPhone = "0" + localPhone.substring(2);
    }

    console.log("[HOOK] Local phone:", localPhone);

    // ==============================
    // Environment Variables
    // ==============================
    const USERNAME = Deno.env.get("SMS_USERNAME");
    const PASSWORD = Deno.env.get("SMS_PASSWORD");
    const DOMAIN = Deno.env.get("SMS_DOMAIN");
    const FROM = Deno.env.get("SMS_FROM");

    if (!USERNAME || !PASSWORD || !DOMAIN || !FROM) {
      console.error("[HOOK] SMS credentials missing");

      return successResponse("config_error");
    }

    // ==============================
    // Message
    // ==============================
    const message = `رمز ورود به چی کو: ${otp}\nchiickoo.ir`;

    const params = new URLSearchParams({
      FROM,
      TO: localPhone,
      TEXT: message,
      USERNAME,
      PASSWORD,
      DOMAIN,
    });

    // آدرس صحیح سرویس
    const apiUrl = `https://0098vip.com/sendsmslink.aspx?${params.toString()}`;

    console.log("[HOOK] API URL:", apiUrl);
    console.log("[HOOK] Sending SMS...");

    // timeout = 10 sec
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    const res = await fetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("[HOOK] HTTP Status:", res.status);

    const body = await res.text();

    console.log("[HOOK] SMS Provider Response:", body);

    const cleanBody = body.trim();

    // معمولاً شناسه عددی = موفق
    const isSuccess = /^\d+$/.test(cleanBody);

    if (!isSuccess) {
      console.error("[HOOK] SMS sending failed:", cleanBody);

      return successResponse("sms_failed");
    }

    console.log(
      "[HOOK] SMS sent successfully. Message ID:",
      cleanBody
    );

    return successResponse(cleanBody);

  } catch (err) {
    console.error("[HOOK] Exception:", err);

    return successResponse("error");
  }
});

// ========================================
// Supabase requires this response structure
// ========================================
function successResponse(messageId: string) {
  return new Response(
    JSON.stringify({
      message_id: messageId,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
