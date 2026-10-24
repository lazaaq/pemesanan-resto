import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { sendPaymentSuccessEmail } from "@/lib/email/resend";
import {
  createDuitkuCallbackSignature,
  getDuitkuServerConfig,
  hasMatchingDuitkuSignature,
} from "@/lib/payments/duitku";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";

type DuitkuCallbackPayload = {
  merchantCode?: string;
  amount?: string;
  merchantOrderId?: string;
  resultCode?: string;
  paymentCode?: string;
  reference?: string;
  signature?: string;
  settlementDate?: string;
};

function getStringValue(value: FormDataEntryValue | unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function readCallbackPayload(request: Request): Promise<DuitkuCallbackPayload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as DuitkuCallbackPayload;
  }

  const formData = await request.formData();

  return Object.fromEntries(
    [
      "merchantCode",
      "amount",
      "merchantOrderId",
      "resultCode",
      "paymentCode",
      "reference",
      "signature",
      "settlementDate",
    ].map((key) => [key, getStringValue(formData.get(key))]),
  );
}

function getPaymentMetadata(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {} as Record<string, Json>;
  }

  return metadata as Record<string, Json>;
}

function getJsonString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const payload = await readCallbackPayload(request);
    const merchantCode = getStringValue(payload.merchantCode);
    const amount = getStringValue(payload.amount);
    const merchantOrderId = getStringValue(payload.merchantOrderId);
    const signature = getStringValue(payload.signature);

    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      return new NextResponse("Invalid callback payload", { status: 400 });
    }

    const { merchantCode: configuredMerchantCode, apiKey } =
      getDuitkuServerConfig();
    const expectedSignature = createDuitkuCallbackSignature(
      configuredMerchantCode,
      amount,
      merchantOrderId,
      apiKey,
    );

    if (
      merchantCode !== configuredMerchantCode ||
      !hasMatchingDuitkuSignature(signature, expectedSignature)
    ) {
      return new NextResponse("Invalid callback signature", { status: 401 });
    }

    const parsedAmount = Number(amount);

    if (!Number.isSafeInteger(parsedAmount)) {
      return new NextResponse("Invalid callback amount", { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total, payment_status, status, metadata")
      .eq("id", merchantOrderId)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (Number(order.total) !== parsedAmount) {
      return new NextResponse("Callback amount mismatch", { status: 400 });
    }

    const isSuccessful = getStringValue(payload.resultCode) === "00";
    const canMarkAsPaid = isSuccessful && order.payment_status === "unpaid";
    const isAlreadyPaid = order.payment_status === "paid";
    const currentMetadata = getPaymentMetadata(order.metadata);
    const currentPayment =
      currentMetadata.payment &&
      typeof currentMetadata.payment === "object" &&
      !Array.isArray(currentMetadata.payment)
        ? (currentMetadata.payment as Record<string, Json>)
        : {};
    const currentNotifications =
      currentMetadata.notifications &&
      typeof currentMetadata.notifications === "object" &&
      !Array.isArray(currentMetadata.notifications)
        ? (currentMetadata.notifications as Record<string, Json>)
        : {};
    const currentPaymentNotification =
      currentNotifications.payment &&
      typeof currentNotifications.payment === "object" &&
      !Array.isArray(currentNotifications.payment)
        ? (currentNotifications.payment as Record<string, Json>)
        : {};
    const nextMetadataObject = {
      ...currentMetadata,
      payment: {
        ...currentPayment,
        status: canMarkAsPaid || isAlreadyPaid ? "paid" : "callback_received",
        result_code: getStringValue(payload.resultCode) || null,
        payment_code: getStringValue(payload.paymentCode) || null,
        reference: getStringValue(payload.reference) || currentPayment.reference || null,
        settlement_date: getStringValue(payload.settlementDate) || null,
        callback_at: new Date().toISOString(),
      },
    } as Record<string, Json>;
    const nextMetadata = nextMetadataObject as Json;

    const update = canMarkAsPaid
      ? {
          payment_status: "paid" as const,
          paid_at: new Date().toISOString(),
          status: order.status === "pending" ? ("confirmed" as const) : order.status,
          metadata: nextMetadata,
        }
      : { metadata: nextMetadata };
    const { error: updateError } = await supabase
      .from("orders")
      .update(update)
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    const customerEmail = getJsonString(currentPayment.customer_email);
    const paymentReference =
      getStringValue(payload.reference) || getJsonString(currentPayment.reference);

    if (
      isSuccessful &&
      (canMarkAsPaid || isAlreadyPaid) &&
      customerEmail &&
      getJsonString(currentPaymentNotification.status) !== "sent"
    ) {
      try {
        const messageId = await sendPaymentSuccessEmail({
          to: customerEmail,
          orderId: order.id,
          restaurantName: siteConfig.name,
          total: Number(order.total),
          reference: paymentReference,
        });

        const { error: notificationUpdateError } = await supabase
          .from("orders")
          .update({
            metadata: {
              ...nextMetadataObject,
              notifications: {
                ...currentNotifications,
                payment: {
                  status: "sent",
                  message_id: messageId,
                  sent_at: new Date().toISOString(),
                },
              },
            },
          })
          .eq("id", order.id);

        if (notificationUpdateError) {
          throw notificationUpdateError;
        }
      } catch (error) {
        console.error("Duitku payment success email error", error);

        return new NextResponse("Payment recorded; email notification will be retried", {
          status: 500,
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    return new NextResponse("SUCCESS", { status: 200 });
  } catch (error) {
    console.error("Duitku callback error", error);

    return new NextResponse("Callback processing failed", { status: 500 });
  }
}
