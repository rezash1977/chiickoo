// Supabase Custom SMS Hook - 0098sms
// Deploy: supabase functions deploy send-sms --no-verify-jwt

// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    console.error("[HOOK] Full Payload:", JSON.stringify(payload));

    // ==============================
    // Extract phone
    // ==============================
    const phone: string | undefined =
      payload?.user?.phone ?? payload?.phone ?? undefined;

    // ==============================
    // Extract OTP (covers all Supabase formats)
    // ==============================
    const otp: string | undefined =
      payload?.sms?.otp ??
      payload?.otp ??
      payload?.token ??
      undefined;

    console.error("[HOOK] Extracted phone:", phone);
    console.error("[HOOK] Extracted otp:", otp);

    if (!phone || !otp) {
      console.error("[HOOK] Missing phone or otp");
      return successResponse("missing_data");
    }

    // ==============================
    // Convert Iranian number to 09 format
    // ==============================
    let localPhone = phone
      .replace(/^\+98/, "0")
      .replace(/^0098/, "0");

    if (!localPhone.startsWith("0")) {
      localPhone = "0" + localPhone;
    }

    console.error("[HOOK] Local phone:", localPhone);

    // ==============================
    // Read environment variables
    // ==============================
    const USERNAME = Deno.env.get("SMS_USERNAME");
    const PASSWORD = Deno.env.get("SMS_PASSWORD");
    const DOMAIN   = Deno.env.get("SMS_DOMAIN");
    const FROM     = Deno.env.get("SMS_FROM");

    if (!USERNAME || !PASSWORD || !DOMAIN || !FROM) {
      console.error("[HOOK] SMS credentials missing");
      return successResponse("config_error");
    }

    // ==============================
    // Create message
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

    const apiUrl = `https://0098vip.com/sendsmslink.aspx?${params.toString()}`;

    console.error("[HOOK] Sending request to 0098sms...");

    const res = await fetch(apiUrl);
    const body = await res.text();

    console.error("[HOOK] SMS Provider Response:", body);

    // 0098sms returns numeric message id when successful
    const cleanBody = body.trim();
    const isSuccess = /^\d+$/.test(cleanBody);

    if (!isSuccess) {
      console.error("[HOOK] SMS sending failed:", cleanBody);
      return successResponse("sms_failed");
    }

    console.error("[HOOK] SMS sent successfully. Message ID:", cleanBody);

    return successResponse(cleanBody);

  } catch (err) {
    console.error("[HOOK] Exception:", err);
    return successResponse("error");
  }
});

// ========================================
// Supabase requires EXACTLY this structure
// ========================================
function successResponse(messageId: string) {
  return new Response(
    JSON.stringify({ message_id: messageId }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
