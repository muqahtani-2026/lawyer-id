import crypto from "node:crypto";

/**
 * تشفير/فكّ تشفير توكنات X باستخدام AES-256-GCM.
 *
 * المفتاح يُقرأ من متغيّر البيئة TOKEN_ENCRYPTION_KEY (32 بايت = 64 محرفًا hex).
 * يُولَّد مرّة واحدة بـ:  openssl rand -hex 32
 *
 * صيغة المخرَج المخزَّن:  base64(iv) : base64(authTag) : base64(ciphertext)
 * IV عشوائيّ لكلّ عمليّة تشفير (12 بايت — القياسيّ لـ GCM).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // بايت
const KEY_LENGTH = 32; // 256-bit

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("TOKEN_ENCRYPTION_KEY غير مضبوط في متغيّرات البيئة.");
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY يجب أن يكون ${KEY_LENGTH} بايت (${KEY_LENGTH * 2} محرفًا hex)، الطول الحاليّ ${key.length}.`,
    );
  }
  return key;
}

/** يُشفّر نصًّا ويعيد سلسلة قابلة للتخزين في عمود text. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** يفكّ تشفير سلسلة أنتجتها encrypt(). يرمي خطأً إن فشلت المصادقة (تلاعب). */
export function decrypt(payload: string): string {
  const key = getKey();
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("صيغة النصّ المشفّر غير صحيحة (المتوقَّع iv:tag:ciphertext).");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
