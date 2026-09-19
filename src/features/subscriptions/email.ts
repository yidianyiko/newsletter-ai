export function confirmationEmail(confirmUrl: string) {
  return {
    subject: "确认订阅 Letterly",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px"><h1 style="font-family:Georgia,serif">只差最后一步</h1><p>点击下面的按钮确认你的订阅。</p><p><a href="${confirmUrl}" style="display:inline-block;background:#ef5b3f;color:white;padding:12px 20px;border-radius:999px;text-decoration:none">确认订阅</a></p><p style="color:#65706a;font-size:13px">如果不是你发起的订阅，请忽略此邮件。</p></div>`,
  };
}
